const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Retailer = require('../models/Retailer');
const DashboardCache = require('../models/DashboardCache');

router.use(verifyToken);

// GET /api/dashboard/kpis
router.get('/kpis', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrdersToday,
      totalSalesToday,
      activeRetailers,
      lowStockItems,
      pendingDeliveries,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      Retailer.countDocuments({ status: 'Active' }),
      Inventory.countDocuments({ qtyAvailable: { $lt: 50 } }), // Arbitrary low stock threshold
      Order.countDocuments({ status: { $in: ['Pending', 'Dispatched'] } }),
      Order.aggregate([
        { $match: { status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ])
    ]);

    res.json({
      totalOrdersToday,
      totalSalesToday: totalSalesToday.length ? totalSalesToday[0].total : 0,
      activeRetailers,
      lowStockItems,
      pendingDeliveries,
      totalRevenue: totalRevenue.length ? totalRevenue[0].total : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching KPIs' });
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
  try {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const [expiringInventory, expiringLicenses] = await Promise.all([
      Inventory.find({ expiryDate: { $lte: nextMonth } }).populate('productId', 'tradeName sku'),
      Retailer.find({ licenseExpiry: { $lte: nextMonth } }).select('name city drugLicense licenseExpiry')
    ]);

    // GSTR-1 check (just a static alert logic if it's before the 11th of the month)
    const isGstrDue = now.getDate() <= 11;

    res.json({
      expiringInventory,
      expiringLicenses,
      gstr1Due: isGstrDue ? `GSTR-1 filing is due by 11th ${now.toLocaleString('default', { month: 'short' })}` : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching alerts' });
  }
});

// GET /api/dashboard/sales
router.get('/sales', async (req, res) => {
  try {
    // Check cache
    const cache = await DashboardCache.findOne({ cacheKey: 'sales_aggregations' });
    if (cache && cache.expiresAt > new Date()) {
      return res.json(cache.data);
    }

    // Fallback computation
    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);

    const [weeklySales] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: last7Days } } },
        { $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            sales: { $sum: "$totalValue" } 
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    const data = { weeklySales };
    const expiresAt = new Date(now.getTime() + 30 * 60000);
    
    await DashboardCache.findOneAndUpdate(
      { cacheKey: 'sales_aggregations' },
      { data, computedAt: now, expiresAt },
      { upsert: true }
    );

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching sales' });
  }
});

module.exports = router;
