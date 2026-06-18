const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Retailer = require('../models/Retailer');

router.use(verifyToken);

// GET all retailers
router.get('/', async (req, res) => {
  try {
    const retailers = await Retailer.find().sort({ name: 1 });
    res.json(retailers);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching retailers' });
  }
});

// POST a new retailer
router.post('/', async (req, res) => {
  try {
    const retailer = new Retailer(req.body);
    await retailer.save();
    res.status(201).json(retailer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error creating retailer' });
  }
});

// PATCH update a retailer
router.patch('/:id', async (req, res) => {
  try {
    const retailer = await Retailer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!retailer) {
      return res.status(404).json({ message: 'Retailer not found' });
    }
    res.json(retailer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error updating retailer' });
  }
});

module.exports = router;
