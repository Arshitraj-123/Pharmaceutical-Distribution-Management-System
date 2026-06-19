const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const Counter = require('../models/Counter');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// GET /api/schemes
router.get('/', async (req, res) => {
  try {
    const schemes = await Scheme.find()
      .populate('companyId', 'name')
      .populate('productId', 'tradeName')
      .sort({ validUntil: 1 })
      .lean();

    const today = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 864e5);

    // Compute status at read-time
    const enrichedSchemes = schemes.map(s => {
      let status = 'Active';
      if (s.validUntil < today) {
        status = 'Expired';
      } else if (s.validUntil < thirtyDaysFromNow) {
        status = 'Expiring';
      }

      return {
        ...s,
        status
      };
    });

    res.json(enrichedSchemes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching schemes' });
  }
});

// POST /api/schemes
router.post('/', async (req, res) => {
  try {
    const { companyId, productId, type, buyQty, freeQty, discountPercent, validUntil } = req.body;

    if (!companyId || !type || !validUntil) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Atomic increment for schemeId
    const counter = await Counter.findOneAndUpdate(
      { name: 'scheme' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    const schemeId = `SCH-${counter.seq.toString().padStart(4, '0')}`;

    const newScheme = new Scheme({
      schemeId,
      companyId,
      productId: productId || null,
      type,
      details: {
        buyQty: type === 'Free Goods' ? Number(buyQty) : undefined,
        freeQty: type === 'Free Goods' ? Number(freeQty) : undefined,
        discountPercent: type === 'Discount' ? Number(discountPercent) : undefined
      },
      validUntil: new Date(validUntil)
    });

    const saved = await newScheme.save();
    
    // Broadcast event
    req.io.emit('schemes:updated');

    res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating scheme' });
  }
});

// DELETE /api/schemes/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Scheme.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Scheme not found' });
    req.io.emit('schemes:updated');
    res.json({ message: 'Scheme deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting scheme' });
  }
});

module.exports = router;
