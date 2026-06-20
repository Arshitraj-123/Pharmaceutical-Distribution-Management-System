const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const Settings = require('../models/Settings');
const { verifyToken } = require('../middleware/auth');
const { logAction } = require('../utils/audit');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Apply auth middleware to all invoice routes
router.use(verifyToken);

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('retailerId', 'name city drugLicense')
      .populate('orderId', 'orderId createdAt status')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
});

// GET /api/invoices/unbilled-orders
router.get('/unbilled-orders', async (req, res) => {
  try {
    // Orders that are 'Delivered'
    const deliveredOrders = await Order.find({ status: 'Delivered' })
      .populate('retailerId', 'name city drugLicense')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch existing invoices to filter out billed orders
    const billedOrderIds = await Invoice.distinct('orderId');
    
    // Filter out orders that are already invoiced
    const unbilledOrders = deliveredOrders.filter(order => !billedOrderIds.some(id => id.toString() === order._id.toString()));

    res.json(unbilledOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching unbilled orders' });
  }
});

// GET /api/invoices/gstr1-export
router.get('/gstr1-export', async (req, res) => {
  try {
    const invoices = await Invoice.find({ irnStatus: { $ne: 'Failed' } })
      .populate('retailerId', 'name gstin city')
      .sort({ createdAt: 1 });

    let csvContent = 'GSTIN/UIN of Recipient,Receiver Name,Invoice Number,Invoice Date,Invoice Value,Place Of Supply,Reverse Charge,Invoice Type,Rate,Taxable Value,Integrated Tax Paid,Central Tax Paid,State/UT Tax Paid\n';

    invoices.forEach(inv => {
      // Group lineItems by gstRate
      const rateBuckets = {};
      
      inv.lineItems.forEach(item => {
        const rate = item.gstRate || 0;
        if (!rateBuckets[rate]) {
          rateBuckets[rate] = { taxableAmount: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        rateBuckets[rate].taxableAmount += item.taxableAmount || 0;
        rateBuckets[rate].cgst += item.cgst || 0;
        rateBuckets[rate].sgst += item.sgst || 0;
        rateBuckets[rate].igst += item.igst || 0;
      });

      const invDate = new Date(inv.createdAt).toLocaleDateString('en-GB'); // DD/MM/YYYY
      const gstin = inv.retailerId?.gstin || '';
      const name = inv.retailerId?.name ? `"${inv.retailerId.name.replace(/"/g, '""')}"` : '';
      const stateCode = '10-Bihar'; // Assuming all current retailers are intrastate for this scope
      const invValue = inv.totalAmount;

      for (const [rateStr, totals] of Object.entries(rateBuckets)) {
        csvContent += `${gstin},${name},${inv.invoiceNo},${invDate},${invValue},${stateCode},N,Regular,${rateStr},${totals.taxableAmount.toFixed(2)},${totals.igst.toFixed(2)},${totals.cgst.toFixed(2)},${totals.sgst.toFixed(2)}\n`;
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="GSTR1_B2B_Report.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating GSTR-1 export' });
  }
});

// POST /api/invoices
router.post('/', [
  body('orderId').isMongoId().withMessage('Invalid order ID')
], validate, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // 1. Guard: Check if invoice already exists
    const existing = await Invoice.findOne({ orderId });
    if (existing) {
      return res.status(409).json({
        code: 'INVOICE_ALREADY_EXISTS',
        message: `Invoice ${existing.invoiceNo} already exists for this order.`
      });
    }

    // 2. Fetch order with items and product details
    const order = await Order.findById(orderId)
      .populate({
        path: 'items',
        populate: [
          { path: 'productId', select: 'tradeName hsnCode gstRate' },
          { path: 'batchId', select: 'batchNo expiryDate' }
        ]
      });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // 3. Guard: Check if status is Delivered
    if (order.status !== 'Delivered') {
      return res.status(400).json({
        code: 'INVOICE_ORDER_NOT_DELIVERED',
        message: 'Invoice can only be generated for delivered orders.'
      });
    }

    // 4. Calculate GST per line item
    const lineItems = order.items.map(item => {
      const qty = item.qtySupplied !== undefined ? item.qtySupplied : item.qtyOrdered;
      const taxable = item.rate * qty;
      const gstRate = (item.productId && item.productId.gstRate) ? item.productId.gstRate : 0;
      const cgst = parseFloat((taxable * (gstRate / 2) / 100).toFixed(2));
      const sgst = cgst;
      
      return {
        productId: item.productId ? item.productId._id : null,
        productName: item.productId ? item.productId.tradeName : 'Unknown',
        hsnCode: item.productId ? item.productId.hsnCode : '',
        batchNo: item.batchId ? item.batchId.batchNo : null,
        expiryDate: item.batchId ? item.batchId.expiryDate : null,
        qty: qty,
        rate: item.rate,
        taxableAmount: taxable,
        gstRate: gstRate,
        cgst: cgst,
        sgst: sgst,
        lineTotal: taxable + cgst + sgst
      };
    });

    // 5. Roll up totals
    const totalTaxable = lineItems.reduce((s, i) => s + i.taxableAmount, 0);
    const totalCGST = lineItems.reduce((s, i) => s + i.cgst, 0);
    const totalSGST = lineItems.reduce((s, i) => s + i.sgst, 0);
    const totalAmount = totalTaxable + totalCGST + totalSGST;

    // 6. Generate sequential invoice number safely (Atomic Counter)
    const counter = await Counter.findOneAndUpdate(
      { name: 'invoice' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const invoiceNo = `INV/26-27/${String(counter.seq).padStart(4, '0')}`;

    // 7. Create Invoice
    const invoice = new Invoice({
      invoiceNo,
      orderId: order._id,
      retailerId: order.retailerId,
      lineItems,
      totalTaxable,
      cgst: totalCGST,
      sgst: totalSGST,
      totalAmount,
      irnStatus: 'Pending'
    });

    await invoice.save();

    logAction({ user: req.user.email, action: `Generated invoice ${invoice.invoiceNo}`, module: 'Billing', ipAddress: req.ip });

    res.status(201).json({ message: 'Invoice generated successfully', invoice });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Duplicate invoice detected' });
    }
    res.status(500).json({ message: 'Server error creating invoice' });
  }
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('retailerId', 'name address city drugLicense gstin')
      .populate('orderId', 'orderId createdAt');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ message: 'System settings not configured' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo.replace(/\//g, '-')}.pdf"`);

    doc.pipe(res);

    // Document Header
    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();

    // Seller Info
    doc.fontSize(14).font('Helvetica-Bold').text(settings.businessName);
    doc.fontSize(10).font('Helvetica')
       .text(settings.address)
       .text(`GSTIN: ${settings.gstin}`)
       .text(`DL No: ${settings.drugLicense}`)
       .text(`State: ${settings.state} (${settings.stateCode})`);
    
    doc.moveDown();

    // Invoice Meta
    const startY = doc.y;
    doc.text(`Invoice No: ${invoice.invoiceNo}`);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`);
    doc.text(`Order Ref: ${invoice.orderId ? invoice.orderId.orderId : 'N/A'}`);
    
    // Buyer Info (Right Aligned)
    doc.text('Bill To:', 350, startY, { underline: true });
    doc.text(invoice.retailerId.name, 350, startY + 15);
    doc.text(`${invoice.retailerId.city || ''}`, 350, startY + 30);
    doc.text(`GSTIN: ${invoice.retailerId.gstin || 'URD'}`, 350, startY + 45);
    doc.text(`DL No: ${invoice.retailerId.drugLicense || 'N/A'}`, 350, startY + 60);

    doc.moveDown(3);

    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Product', 50, tableTop);
    doc.text('HSN', 200, tableTop);
    doc.text('Batch', 250, tableTop);
    doc.text('Exp', 300, tableTop);
    doc.text('Qty', 350, tableTop);
    doc.text('Rate', 380, tableTop);
    doc.text('GST%', 420, tableTop);
    doc.text('Total', 480, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    
    let y = tableTop + 25;
    doc.font('Helvetica');

    invoice.lineItems.forEach(item => {
      if (y > 600) {
        doc.addPage();
        y = 50;
      }
      doc.text((item.productName || 'Unknown').substring(0, 25), 50, y);
      doc.text(item.hsnCode || '-', 200, y);
      doc.text(item.batchNo || '-', 250, y);
      const expDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : '-';
      doc.text(expDate, 300, y);
      doc.text((item.qty || 0).toString(), 350, y);
      doc.text((item.rate || 0).toFixed(2), 380, y);
      doc.text((item.gstRate || 0).toString(), 420, y);
      doc.text((item.lineTotal || 0).toFixed(2), 480, y);
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;

    // Totals
    doc.font('Helvetica-Bold');
    doc.text('Taxable Amount:', 350, y);
    doc.text(`Rs. ${invoice.totalTaxable.toFixed(2)}`, 480, y);
    y += 15;
    doc.text('Total CGST:', 350, y);
    doc.text(`Rs. ${invoice.cgst.toFixed(2)}`, 480, y);
    y += 15;
    doc.text('Total SGST:', 350, y);
    doc.text(`Rs. ${invoice.sgst.toFixed(2)}`, 480, y);
    y += 20;
    doc.fontSize(12).text('Grand Total:', 350, y);
    doc.text(`Rs. ${invoice.totalAmount.toFixed(2)}`, 480, y);

    // Footer Info
    doc.fontSize(10).font('Helvetica');
    const footerY = y + 40 > 650 ? 650 : y + 40;
    
    doc.text('Bank Details:', 50, footerY, { underline: true });
    doc.text(`A/c Name: ${settings.bankDetails.accountName}`, 50, footerY + 15);
    doc.text(`A/c No: ${settings.bankDetails.accountNumber}`, 50, footerY + 30);
    doc.text(`IFSC: ${settings.bankDetails.ifsc}`, 50, footerY + 45);
    doc.text(`Bank: ${settings.bankDetails.bankName}`, 50, footerY + 60);

    doc.fontSize(8);
    doc.text('Terms & Conditions:', 350, footerY);
    doc.text('1. Goods once sold will not be taken back except for quality issues or expiry.', 350, footerY + 12, { width: 200 });
    doc.text('2. Subject to Patna jurisdiction.', 350, footerY + 36, { width: 200 });
    doc.text('3. E. & O.E.', 350, footerY + 48, { width: 200 });

    doc.fontSize(9).font('Helvetica-Oblique');
    doc.text('This is a computer-generated invoice and does not require a physical signature.', 50, footerY + 80, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error generating PDF' });
    }
  }
});

module.exports = router;
