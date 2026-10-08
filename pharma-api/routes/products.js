const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const Product = require('../models/Product');
const Company = require('../models/Company');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const Notification = require('../models/Notification');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// ============================================================================
// PUBLIC / RETAILER ANNOUNCEMENTS ENDPOINT
// ============================================================================
// PUBLIC / RETAILER ANNOUNCEMENTS ENDPOINT
// GET /api/products/announcements
// Note: Timer applied:
// - 2 days (48 hours) for non-registered retailer users (guests)
// - 1 day (24 hours) for registered retailer users
// - When multiple new products are added, all are returned for the slide banner
// ============================================================================
router.get('/announcements', async (req, res) => {
  try {
    const userType = req.query.userType || (req.header('Authorization') ? 'registered' : 'guest');
    const maxAgeHours = userType === 'registered' ? 24 : 48;
    const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    const filter = {
      isNewLaunch: true
    };

    // Unless explicitly requesting all launches without timer filter, enforce the 1-day / 2-day cutoff
    if (req.query.ignoreTimer !== 'true') {
      filter.$or = [
        { announcedAt: { $gte: cutoffDate } },
        { announcedAt: { $exists: false }, createdAt: { $gte: cutoffDate } },
        { announcedAt: null, createdAt: { $gte: cutoffDate } }
      ];
    }

    const products = await Product.find(filter)
      .populate('companyId', 'name')
      .sort({ announcedAt: -1, createdAt: -1 })
      .limit(12)
      .select('-ptr -priceTiers -costPrice');

    const announcements = products.map(p => ({
      _id: p._id,
      id: p._id,
      name: p.tradeName,
      tradeName: p.tradeName,
      genericName: p.genericName || '',
      category: p.category || 'counter-products',
      schedule: p.schedule || 'OTC',
      mrp: p.mrp,
      packing: p.packing || 'Standard Pack',
      description: p.description || '',
      brand: p.companyId?.name || 'Aadya Medicine Agencies',
      company: p.companyId?.name || 'Aadya Medicine Agencies',
      imageUrl: p.imageUrl || '',
      announcedAt: p.announcedAt || p.createdAt,
      createdAt: p.createdAt
    }));

    res.json({
      announcements,
      userType,
      maxAgeHours,
      cutoffDate
    });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
});

// ============================================================================
// PUBLIC: GET /api/products - Get master catalog list (with company populated)
// Accessible by both registered and guest retailers for browsing
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('companyId', 'name')
      .sort({ tradeName: 1 });
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching products' });
  }
});

// ============================================================================
// PUBLIC: GET /api/products/:id - Get single product details
// ============================================================================
router.get('/:id', async (req, res, next) => {
  // Pass through if the id matches another subroute like "companies"
  if (req.params.id === 'companies') return next();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id)
      .populate('companyId', 'name');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching product' });
  }
});

// All subsequent routes require authentication
router.use(verifyToken);

// ============================================================================
// GET /api/products/companies - Get suppliers list
// ============================================================================
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ name: 1 });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching companies' });
  }
});

// ============================================================================
// POST /api/products - Create new product with optional initial batch
// Includes:
// - Server-side announcement guard (Modification 2): isNewLaunch enforced on backend
// - Atomic session transaction for initial batch + GRN + Purchase (Modification 3)
// - Sanitized socket.io broadcast without PTR (Modification 1)
// ============================================================================
router.post('/', [
  body('tradeName').trim().notEmpty().withMessage('Product trade name is required'),
  body('mrp').isFloat({ gt: 0 }).withMessage('MRP must be a positive number'),
  body('ptr').isFloat({ gt: 0 }).withMessage('PTR must be a positive number'),
  body('category').optional().trim(),
  body('genericName').optional().trim(),
  body('companyId').optional().trim(),
  body('companyName').optional().trim(),
  body('packing').optional().trim(),
  body('schedule').optional().trim(),
  body('hsnCode').optional().trim(),
  body('gstRate').optional().isFloat({ min: 0 })
], validate, async (req, res) => {
  let session = null;
  let standaloneCleanupId = null;

  try {
    const {
      tradeName,
      genericName,
      companyId: inputCompanyId,
      companyName,
      category,
      schedule,
      hsnCode,
      gstRate,
      mrp,
      ptr,
      packing,
      description,
      sku: customSku,
      initialBatch
    } = req.body;

    // 1. Resolve or Create Company
    let supplierId = inputCompanyId;
    let companyDoc = null;

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      companyDoc = await Company.findById(supplierId);
    }

    if (!companyDoc && companyName && companyName.trim()) {
      companyDoc = await Company.findOne({ name: new RegExp(`^${companyName.trim()}$`, 'i') });
      if (!companyDoc) {
        companyDoc = await Company.create({ name: companyName.trim() });
      }
      supplierId = companyDoc._id;
    }

    if (!supplierId || !companyDoc) {
      // Fallback: pick first available company or create default distributor company
      companyDoc = await Company.findOne({});
      if (!companyDoc) {
        companyDoc = await Company.create({ name: 'Aadya Medicine Agencies' });
      }
      supplierId = companyDoc._id;
    }

    // 2. Generate unique SKU if not provided
    let sku = customSku && customSku.trim();
    if (!sku) {
      const cleanPrefix = tradeName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'SKU';
      sku = `${cleanPrefix}-${Date.now().toString().slice(-6)}`;
    }

    // Check duplicate SKU
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      sku = `${sku}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 3. Server-side announcement guard (Modification 2)
    // When an authorized Admin/Manager adds a product, backend guarantees isNewLaunch = true
    // regardless of any frontend tampered payloads.
    const isNewLaunch = true;

    const productPayload = {
      sku,
      tradeName: tradeName.trim(),
      genericName: genericName ? genericName.trim() : '',
      companyId: supplierId,
      category: category ? category.trim() : 'counter-products',
      schedule: schedule ? schedule.trim() : 'OTC',
      hsnCode: hsnCode ? hsnCode.trim() : '',
      gstRate: Number(gstRate) || 0,
      mrp: Number(mrp),
      ptr: Number(ptr),
      packing: packing ? packing.trim() : 'Standard Pack',
      description: description ? description.trim() : '',
      isNewLaunch: isNewLaunch,
      announcedAt: new Date()
    };

    const hasInitialBatch = initialBatch &&
      initialBatch.batchNo &&
      initialBatch.batchNo.trim() &&
      initialBatch.expiryDate &&
      Number(initialBatch.qty) > 0;

    // 4. Try MongoDB session transaction (Modification 3)
    let useTransaction = false;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } catch (sessionErr) {
      // Graceful fallback for standalone MongoDB instances without replica sets
      session = null;
      useTransaction = false;
    }

    let createdProduct = null;

    if (useTransaction && session) {
      // Atomic transaction execution
      const [newProd] = await Product.create([productPayload], { session });
      createdProduct = newProd;

      if (hasInitialBatch) {
        const qty = Number(initialBatch.qty);
        const cost = Number(ptr);
        const lineTotal = qty * cost;
        const expDate = new Date(initialBatch.expiryDate.includes('-') && initialBatch.expiryDate.length === 7 ? `${initialBatch.expiryDate}-01` : initialBatch.expiryDate);

        // 4a. Inventory Batch Doc
        const batchDoc = {
          productId: createdProduct._id,
          batchNo: initialBatch.batchNo.trim(),
          expiryDate: expDate,
          qtyAvailable: qty,
          rackLocation: initialBatch.rackLocation ? initialBatch.rackLocation.trim() : '',
          costPrice: cost
        };
        await Inventory.create([batchDoc], { session });

        // 4b. Purchase GRN Doc
        const purchaseDoc = {
          supplierId,
          supplierInvoiceNo: initialBatch.supplierInvoiceNo ? initialBatch.supplierInvoiceNo.trim() : `INIT-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date(),
          items: [{
            productId: createdProduct._id,
            batchNo: initialBatch.batchNo.trim(),
            expiryDate: expDate,
            qtyReceived: qty,
            ptr: cost,
            lineTotal
          }],
          totalAmount: lineTotal
        };
        await Purchase.create([purchaseDoc], { session });

        // 4c. Increment supplier outstanding balance and MTD
        await Company.findByIdAndUpdate(
          supplierId,
          {
            $inc: {
              outstandingBalance: lineTotal,
              totalPurchaseMTD: lineTotal
            }
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();
      session = null;
    } else {
      // Standalone mode atomic fallback sequence
      createdProduct = await Product.create(productPayload);
      standaloneCleanupId = createdProduct._id;

      if (hasInitialBatch) {
        const qty = Number(initialBatch.qty);
        const cost = Number(ptr);
        const lineTotal = qty * cost;
        const expDate = new Date(initialBatch.expiryDate.includes('-') && initialBatch.expiryDate.length === 7 ? `${initialBatch.expiryDate}-01` : initialBatch.expiryDate);

        await Inventory.create({
          productId: createdProduct._id,
          batchNo: initialBatch.batchNo.trim(),
          expiryDate: expDate,
          qtyAvailable: qty,
          rackLocation: initialBatch.rackLocation ? initialBatch.rackLocation.trim() : '',
          costPrice: cost
        });

        await Purchase.create({
          supplierId,
          supplierInvoiceNo: initialBatch.supplierInvoiceNo ? initialBatch.supplierInvoiceNo.trim() : `INIT-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date(),
          items: [{
            productId: createdProduct._id,
            batchNo: initialBatch.batchNo.trim(),
            expiryDate: expDate,
            qtyReceived: qty,
            ptr: cost,
            lineTotal
          }],
          totalAmount: lineTotal
        });

        await Company.findByIdAndUpdate(
          supplierId,
          {
            $inc: {
              outstandingBalance: lineTotal,
              totalPurchaseMTD: lineTotal
            }
          }
        );
      }
      standaloneCleanupId = null; // Successfully completed
    }

    // 5. In-app Notification
    try {
      await Notification.create({
        type: 'Info',
        title: `New Product Added: ${createdProduct.tradeName}`,
        message: `${createdProduct.tradeName} has been added to category ${createdProduct.category}.`,
        module: 'Inventory',
        priority: 1
      });
    } catch (notifErr) {
      console.warn('Could not save in-app notification:', notifErr);
    }

    // 6. Real-time Socket.io Broadcast (Modification 1 & 2)
    // Server-side guard: Only broadcast if isNewLaunch is true in the saved document.
    // Confidentiality guard: Strict removal of PTR to prevent leaking pricing tiers!
    if (createdProduct && createdProduct.isNewLaunch && req.io) {
      const sanitizedAnnouncement = {
        _id: createdProduct._id,
        id: createdProduct._id,
        name: createdProduct.tradeName,
        tradeName: createdProduct.tradeName,
        genericName: createdProduct.genericName || '',
        category: createdProduct.category || 'counter-products',
        schedule: createdProduct.schedule || 'OTC',
        mrp: createdProduct.mrp,
        packing: createdProduct.packing || 'Standard Pack',
        description: createdProduct.description || '',
        brand: companyDoc ? companyDoc.name : 'Aadya Medicine Agencies',
        company: companyDoc ? companyDoc.name : 'Aadya Medicine Agencies',
        announcedAt: createdProduct.announcedAt || new Date(),
        isNewLaunch: true
      };

      req.io.emit('product:new', sanitizedAnnouncement);
      req.io.emit('inventory:updated');
      req.io.emit('dashboard:refresh-kpis');
      req.io.emit('purchases:updated');
    }

    res.status(201).json({
      message: 'Product created and announced successfully',
      product: createdProduct
    });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        console.error('Error aborting session:', abortErr);
      }
    }

    // Standalone cleanup if non-session transaction failed halfway
    if (standaloneCleanupId) {
      try {
        await Product.findByIdAndDelete(standaloneCleanupId);
        await Inventory.deleteMany({ productId: standaloneCleanupId });
      } catch (cleanErr) {
        console.error('Error cleaning up standalone product:', cleanErr);
      }
    }

    console.error('Error in POST /api/products:', err);
    res.status(500).json({
      message: err.message || 'Failed to create product'
    });
  }
});

module.exports = router;
