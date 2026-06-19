const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Product = require('../models/Product');

router.use(verifyToken);

// GET /api/products - Get master catalog list (with company populated)
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

// GET /api/products/companies - Get suppliers list
router.get('/companies', async (req, res) => {
  try {
    const Company = require('../models/Company');
    const companies = await Company.find({}).sort({ name: 1 });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching companies' });
  }
});

module.exports = router;
