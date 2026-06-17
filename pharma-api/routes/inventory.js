const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Inventory = require('../models/Inventory');

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

// POST /api/inventory/grn - Record new stock receipt
router.post('/grn', async (req, res) => {
  try {
    const { productId, batchNo, expiryDate, qtyReceived, rackLocation, ptr } = req.body;
    
    if (!productId || !batchNo || !expiryDate || !qtyReceived || !ptr) {
      return res.status(400).json({ message: 'Missing required GRN fields' });
    }

    // ALWAYS create a new document for exact receipt-level traceability
    const newBatch = new Inventory({
      productId,
      batchNo,
      expiryDate,
      qtyAvailable: Number(qtyReceived),
      rackLocation,
      costPrice: Number(ptr)
    });

    await newBatch.save();

    // Update the Product master catalog's PTR to the latest receipt's PTR
    const Product = require('../models/Product');
    await Product.findByIdAndUpdate(productId, { ptr: Number(ptr) });

    req.io.emit('dashboard:refresh-kpis');
    req.io.emit('inventory:updated');

    res.status(201).json({ message: 'Stock received successfully', batch: newBatch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating GRN' });
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
