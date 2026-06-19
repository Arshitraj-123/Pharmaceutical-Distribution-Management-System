const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Retailer = require('../models/Retailer');
const OrderItem = require('../models/OrderItem');
const Recall = require('../models/Recall');
const Settings = require('../models/Settings');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/compliance/summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Retailer License Expiry
    const retailers = await Retailer.find({ status: { $ne: 'Inactive' } });
    
    let validCount = 0;
    let expiring90Count = 0;
    let expiring30Count = 0;
    let expiredCount = 0;

    retailers.forEach(r => {
      if (!r.licenseExpiry) return; // Ignore if no license stored
      
      const diffTime = r.licenseExpiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) expiredCount++;
      else if (diffDays <= 30) expiring30Count++;
      else if (diffDays <= 90) expiring90Count++;
      else validCount++;
    });

    // 2. Schedule H/H1/X counts from Dispatched/Delivered Orders
    const scheduleCounts = await OrderItem.aggregate([
      // Join to the parent order
      { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },

      // Only today's dispatched or delivered orders
      { $match: {
        'order.status': { $in: ['Dispatched', 'Delivered'] },
        'order.createdAt': { $gte: startOfDay }
      }},

      // Join to product to get schedule classification
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      
      // Only Schedule H, H1, X
      { $match: { 'product.schedule': { $in: ['H', 'H1', 'X'] }}},

      // Group by schedule type and sum quantities
      { $group: {
        _id: '$product.schedule',
        transactionCount: { $sum: 1 },
        totalUnitsDispensed: { $sum: '$qtySupplied' }
      }}
    ]);

    const scheduleData = {
      'H': { transactionCount: 0, totalUnitsDispensed: 0 },
      'H1': { transactionCount: 0, totalUnitsDispensed: 0 },
      'X': { transactionCount: 0, totalUnitsDispensed: 0 }
    };

    scheduleCounts.forEach(sc => {
      scheduleData[sc._id] = {
        transactionCount: sc.transactionCount,
        totalUnitsDispensed: sc.totalUnitsDispensed
      };
    });

    // 3. Recalls
    const activeRecalls = await Recall.countDocuments({ status: 'Active' });

    res.json({
      licenses: {
        valid: validCount,
        expiring90: expiring90Count,
        expiring30: expiring30Count,
        expired: expiredCount
      },
      schedules: scheduleData,
      activeRecalls
    });

  } catch (error) {
    console.error('Compliance Summary Error:', error);
    res.status(500).json({ message: 'Server error generating compliance summary' });
  }
});

// GET /api/compliance/schedule-x-register
router.get('/schedule-x-register', async (req, res) => {
  try {
    const registerRows = await OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.status': { $in: ['Dispatched', 'Delivered'] } } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.schedule': 'X' } },
      { $lookup: { from: 'retailers', localField: 'order.retailerId', foreignField: '_id', as: 'retailer' } },
      { $unwind: '$retailer' },
      { $lookup: { from: 'inventories', localField: 'batchId', foreignField: '_id', as: 'batch' } },
      { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
      { $project: {
        date: '$order.createdAt',
        retailerName: '$retailer.name',
        drugLicense: '$retailer.drugLicense',
        product: '$product.tradeName',
        batchNo: '$batch.batchNo',
        qtySupplied: 1,
        orderRef: '$order.orderId'
      }},
      { $sort: { date: -1 } }
    ]);
    res.json(registerRows);
  } catch (error) {
    console.error('Schedule X Register Error:', error);
    res.status(500).json({ message: 'Server error generating Schedule X register' });
  }
});

// GET /api/compliance/schedule-x-register/pdf
router.get('/schedule-x-register/pdf', async (req, res) => {
  try {
    const registerRows = await OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'orderId', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.status': { $in: ['Dispatched', 'Delivered'] } } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $match: { 'product.schedule': 'X' } },
      { $lookup: { from: 'retailers', localField: 'order.retailerId', foreignField: '_id', as: 'retailer' } },
      { $unwind: '$retailer' },
      { $lookup: { from: 'inventories', localField: 'batchId', foreignField: '_id', as: 'batch' } },
      { $unwind: { path: '$batch', preserveNullAndEmptyArrays: true } },
      { $project: {
        date: '$order.createdAt',
        retailerName: '$retailer.name',
        drugLicense: '$retailer.drugLicense',
        product: '$product.tradeName',
        batchNo: '$batch.batchNo',
        qtySupplied: 1,
        orderRef: '$order.orderId'
      }},
      { $sort: { date: -1 } }
    ]);

    const settings = await Settings.findOne();
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Schedule_X_Register.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('SCHEDULE X REGISTER', { align: 'center' });
    doc.fontSize(12).text(settings?.businessName || 'Aadhya Pharmex', { align: 'center' });
    doc.fontSize(10).text(`DL No: ${settings?.drugLicense || 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Date', 40, tableTop);
    doc.text('Retailer Name', 120, tableTop);
    doc.text('DL No.', 270, tableTop);
    doc.text('Product', 390, tableTop);
    doc.text('Batch', 540, tableTop);
    doc.text('Qty', 640, tableTop);
    doc.text('Ref No.', 690, tableTop);
    doc.moveTo(40, tableTop + 15).lineTo(780, tableTop + 15).stroke();

    let y = tableTop + 25;
    doc.font('Helvetica');

    registerRows.forEach(row => {
      if (y > 500) {
        doc.addPage({ layout: 'landscape' });
        y = 40;
      }
      doc.text(new Date(row.date).toLocaleDateString('en-GB'), 40, y);
      doc.text((row.retailerName || '').substring(0, 25), 120, y);
      doc.text(row.drugLicense || 'N/A', 270, y);
      doc.text((row.product || '').substring(0, 25), 390, y);
      doc.text(row.batchNo || '-', 540, y);
      doc.text((row.qtySupplied || 0).toString(), 640, y);
      doc.text(row.orderRef || '-', 690, y);
      y += 20;
    });

    doc.end();

  } catch (error) {
    console.error('PDF Register Error:', error);
    if (!res.headersSent) res.status(500).json({ message: 'Server error generating PDF' });
  }
});

// GET /api/compliance/recalls
router.get('/recalls', async (req, res) => {
  try {
    const recalls = await Recall.find().sort({ noticeDate: -1 });
    res.json(recalls);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching recalls' });
  }
});

// POST /api/compliance/recalls
router.post('/recalls', async (req, res) => {
  try {
    const recall = new Recall(req.body);
    await recall.save();
    req.io.emit('compliance:updated');
    res.status(201).json(recall);
  } catch (err) {
    res.status(500).json({ message: 'Error creating recall' });
  }
});

// PUT /api/compliance/recalls/:id/resolve
router.put('/recalls/:id/resolve', async (req, res) => {
  try {
    const recall = await Recall.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
    res.json(recall);
  } catch (err) {
    res.status(500).json({ message: 'Error resolving recall' });
  }
});

// DELETE /api/compliance/recalls/:id
router.delete('/recalls/:id', async (req, res) => {
  try {
    await Recall.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recall deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting recall' });
  }
});

module.exports = router;
