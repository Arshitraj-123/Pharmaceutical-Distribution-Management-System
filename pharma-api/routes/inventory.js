const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const Company = require('../models/Company');
const Product = require('../models/Product');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const inventory = await Inventory.find({ qtyAvailable: { $gt: 0 } })
      .populate({
        path: 'productId',
        populate: { path: 'companyId', select: 'name' }
      })
      .sort({ expiryDate: 1 });
      
    // Group by product so the frontend dropdown is clean
    const grouped = {};
    for (const item of inventory) {
      // Sometimes productId can be null if the product was deleted, guard against it
      if (!item.productId) continue;
      if (!grouped[item.productId._id]) {
        grouped[item.productId._id] = {
          _id: item.productId._id,
          name: item.productId.tradeName,
          company: item.productId.companyId?.name || 'Unknown',
          ptr: item.productId.ptr,
          totalQty: 0
        };
      }
      grouped[item.productId._id].totalQty += item.qtyAvailable;
    }
    
    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching inventory' });
  }
});
// GET /api/inventory/batches - Batch level for Inventory Page
router.get('/batches', async (req, res) => {
  try {
    const batches = await Inventory.find({ qtyAvailable: { $gt: 0 } })
      .populate({
        path: 'productId',
        populate: { path: 'companyId', select: 'name' }
      })
      .sort({ expiryDate: 1 });
    res.json({ batches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching batches' });
  }
});

// POST /api/inventory/grn - Record new stock receipt (Multi-item GRN + Purchase + Balance)
router.post('/grn', [
  body('supplierId').isMongoId().withMessage('Invalid supplier ID'),
  body('supplierInvoiceNo').notEmpty().withMessage('Supplier invoice number is required'),
  body('invoiceDate').isISO8601().withMessage('Invalid invoice date'),
  body('items').isArray({ min: 1 }).withMessage('Items must be an array with at least one item'),
  body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
  body('items.*.batchNo').notEmpty().withMessage('Batch number is required'),
  body('items.*.expiryDate').isISO8601().withMessage('Invalid expiry date'),
  body('items.*.qtyReceived').isInt({ gt: 0 }).withMessage('Quantity received must be positive'),
  body('items.*.ptr').isFloat({ min: 0 }).withMessage('PTR must be non-negative')
], validate, async (req, res) => {
  try {
    const { supplierId, supplierInvoiceNo, invoiceDate, items } = req.body;
    
    if (!supplierId || !supplierInvoiceNo || !invoiceDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing required GRN fields or items array is empty' });
    }

    // 1. Guard: Check for Duplicate Invoice
    const existing = await Purchase.findOne({ supplierId, supplierInvoiceNo });
    if (existing) {
      return res.status(409).json({
        code: 'GRN_DUPLICATE_INVOICE',
        message: `Supplier invoice ${supplierInvoiceNo} has already been received.`
      });
    }

    let totalAmount = 0;
    const batchDocs = [];
    const purchaseItems = [];
    const productUpdates = [];

    // Pre-process items
    for (const item of items) {
      const { productId, batchNo, expiryDate, qtyReceived, rackLocation, ptr } = item;
      
      if (!productId || !batchNo || !expiryDate || !qtyReceived || !ptr) {
        throw new Error('Missing required fields in one or more items');
      }

      const qty = Number(qtyReceived);
      const cost = Number(ptr);
      const lineTotal = qty * cost;
      totalAmount += lineTotal;

      // Prepare Inventory Docs (ALWAYS NEW documents for exact lot traceability)
      batchDocs.push({
        productId,
        batchNo,
        expiryDate: new Date(expiryDate),
        qtyAvailable: qty,
        rackLocation: rackLocation || '',
        costPrice: cost
      });

      // Prepare Purchase Items
      purchaseItems.push({
        productId,
        batchNo,
        expiryDate: new Date(expiryDate),
        qtyReceived: qty,
        ptr: cost,
        lineTotal
      });

      // Prepare Product PTR Updates
      productUpdates.push({ productId, ptr: cost });
    }

    const purchaseDoc = {
      supplierId,
      supplierInvoiceNo,
      invoiceDate: new Date(invoiceDate),
      items: purchaseItems,
      totalAmount
    };

    // --- WRITES (Standalone MongoDB without Transactions) ---
    // 1. Create all Inventory batch documents
    await Inventory.insertMany(batchDocs);

    // 2. Create the Purchase document
    await Purchase.create(purchaseDoc);

    // 3. Increment supplier outstanding balance and MTD
    await Company.findByIdAndUpdate(
      supplierId,
      { 
        $inc: { 
          outstandingBalance: totalAmount,
          totalPurchaseMTD: totalAmount 
        } 
      }
    );

    // 4. Update the Product master catalog's PTR for each item
    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { ptr: update.ptr }
      );
    }

    req.io.emit('dashboard:refresh-kpis');
    req.io.emit('inventory:updated');
    req.io.emit('purchases:updated');

    res.status(201).json({ message: 'GRN recorded and Purchase created successfully' });
  } catch (err) {
    console.error(err);
    // Differentiate between our thrown validation error and real server errors
    if (err.message === 'Missing required fields in one or more items') {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: 'Server error creating GRN' });
    }
  }
});
// PATCH /api/inventory/batches/:id - Edit rack or cost
router.patch('/batches/:id', async (req, res) => {
  try {
    const { rackLocation, costPrice } = req.body;
    const batch = await Inventory.findByIdAndUpdate(
      req.params.id,
      { rackLocation, costPrice: Number(costPrice) },
      { new: true }
    );
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    req.io.emit('inventory:updated');
    res.json({ message: 'Batch updated', batch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating batch' });
  }
});

module.exports = router;
