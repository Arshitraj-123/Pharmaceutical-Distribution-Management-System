const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Retailer = require('../models/Retailer');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const retailers = await Retailer.find().sort({ name: 1 });
    res.json(retailers);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching retailers' });
  }
});

module.exports = router;
