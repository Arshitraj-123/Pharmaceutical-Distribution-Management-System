const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Purchase = require('../models/Purchase');

router.use(verifyToken);

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplierId', 'name')
      .populate({
        path: 'items.productId',
        select: 'tradeName'
      })
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching purchases' });
  }
});

module.exports = router;
