const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Retailer = require('../models/Retailer');
const Scheme = require('../models/Scheme');
const Purchase = require('../models/Purchase');

router.use(verifyToken);

// GET /api/reports/near-expiry?days=60
router.get('/near-expiry', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const inventory = await Inventory.find({ 
      qtyAvailable: { $gt: 0 },
      expiryDate: { $lte: targetDate } 
    })
    .populate({
      path: 'productId',
      populate: { path: 'companyId', select: 'name' }
    })
    .sort({ expiryDate: 1 });

    let csvContent = 'Product Name,Company,Batch No,Expiry Date,Qty Available,PTR,Rack Location,Days to Expiry\n';

    const today = new Date();
    inventory.forEach(item => {
      const prodName = item.productId?.tradeName ? `"${item.productId.tradeName.replace(/"/g, '""')}"` : 'Unknown';
      const company = item.productId?.companyId?.name ? `"${item.productId.companyId.name.replace(/"/g, '""')}"` : 'Unknown';
      const batchNo = item.batchNo || '';
      const expDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : '';
      
      const diffTime = item.expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      csvContent += `${prodName},${company},${batchNo},${expDate},${item.qtyAvailable},${item.costPrice || 0},"${item.rackLocation || ''}",${diffDays}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Near_Expiry_Report_${days}_Days.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Near expiry report error:', error);
    res.status(500).json({ message: 'Server error generating near expiry report' });
  }
});

// GET /api/reports/daily-sales
router.get('/daily-sales', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const orders = await Order.find({ 
      createdAt: { $gte: startOfDay },
      status: { $in: ['Dispatched', 'Delivered'] }
    })
    .populate('retailerId', 'name city gstin')
    .sort({ createdAt: -1 });

    let csvContent = 'Order Ref,Date,Retailer,City,GSTIN,Status,Total Value,Payment Mode\n';

    orders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleString('en-GB');
      const retailer = order.retailerId?.name ? `"${order.retailerId.name.replace(/"/g, '""')}"` : 'Unknown';
      const city = order.retailerId?.city || '';
      const gstin = order.retailerId?.gstin || '';
      
      csvContent += `${order.orderId},${date},${retailer},${city},${gstin},${order.status},${order.totalValue},${order.paymentMode}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Daily_Sales_Summary.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({ message: 'Server error generating daily sales report' });
  }
});

// GET /api/reports/aging
router.get('/aging', async (req, res) => {
  try {
    const retailers = await Retailer.find({ outstandingBalance: { $gt: 0 } }).sort({ outstandingBalance: -1 });
    let csvContent = 'Retailer Name,City,Phone,GSTIN,Outstanding Balance (Rs)\n';
    retailers.forEach(r => {
      const name = r.name ? `"${r.name.replace(/"/g, '""')}"` : 'Unknown';
      const city = r.city || '';
      const phone = r.contactPhone || '';
      const gstin = r.gstin || '';
      csvContent += `${name},${city},${phone},${gstin},${r.outstandingBalance}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Outstanding_Aging_Report.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Aging report error:', error);
    res.status(500).json({ message: 'Server error generating aging report' });
  }
});

// GET /api/reports/schemes
router.get('/schemes', async (req, res) => {
  try {
    const schemes = await Scheme.find().populate('companyId', 'name').sort({ isActive: -1 });
    let csvContent = 'Scheme Name,Company,Type,Min Qty,Free Qty,Discount %,Status\n';
    schemes.forEach(s => {
      const name = s.name ? `"${s.name.replace(/"/g, '""')}"` : 'Unknown';
      const company = s.companyId?.name ? `"${s.companyId.name.replace(/"/g, '""')}"` : 'Unknown';
      const status = s.isActive ? 'Active' : 'Inactive';
      csvContent += `${name},${company},${s.type},${s.minQty || ''},${s.freeQty || ''},${s.discountPercent || ''},${status}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Company_Scheme_Utilisation.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Schemes report error:', error);
    res.status(500).json({ message: 'Server error generating schemes report' });
  }
});

// GET /api/reports/pnl
router.get('/pnl', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const fyStartYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const startDate = new Date(fyStartYear, 3, 1);

    const [sales, purchases] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, totalSales: { $sum: "$totalValue" } } }
      ]),
      Purchase.aggregate([
        { $match: { invoiceDate: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$invoiceDate" } }, totalPurchases: { $sum: "$totalAmount" } } }
      ])
    ]);

    const pnlMap = {};
    sales.forEach(s => pnlMap[s._id] = { sales: s.totalSales, purchases: 0 });
    purchases.forEach(p => {
      if (!pnlMap[p._id]) pnlMap[p._id] = { sales: 0, purchases: 0 };
      pnlMap[p._id].purchases = p.totalPurchases;
    });

    let csvContent = 'Month,Total Sales (Rs),Total Purchases/COGS (Rs),Gross Margin (Rs)\n';
    Object.keys(pnlMap).sort().forEach(month => {
      const margin = pnlMap[month].sales - pnlMap[month].purchases;
      csvContent += `${month},${pnlMap[month].sales},${pnlMap[month].purchases},${margin}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Profit_and_Loss.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('P&L report error:', error);
    res.status(500).json({ message: 'Server error generating P&L report' });
  }
});

// GET /api/reports/purchases
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('supplierId', 'name').sort({ invoiceDate: -1 });
    let csvContent = 'Date,Supplier Name,Supplier Invoice No,Total Amount (Rs)\n';
    purchases.forEach(p => {
      const date = new Date(p.invoiceDate).toLocaleDateString('en-GB');
      const supplier = p.supplierId?.name ? `"${p.supplierId.name.replace(/"/g, '""')}"` : 'Unknown';
      csvContent += `${date},${supplier},${p.supplierInvoiceNo},${p.totalAmount}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Purchase_Register.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Purchase register error:', error);
    res.status(500).json({ message: 'Server error generating purchase register' });
  }
});

module.exports = router;
