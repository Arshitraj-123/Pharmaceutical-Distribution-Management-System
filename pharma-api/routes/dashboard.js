const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
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

// GET /api/dashboard/top-products
router.get('/top-products', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: today } }).select('_id');
    const orderIds = orders.map(o => o._id);

    const topProducts = await OrderItem.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      { $group: { _id: '$productId', totalQty: { $sum: '$qtyOrdered' }, revenue: { $sum: '$lineTotal' } } },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { _id: 1, totalQty: 1, revenue: 1, name: '$product.tradeName', sku: '$product.sku' } }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching top products' });
  }
});

// GET /api/dashboard/sales/by-company
router.get('/sales/by-company', async (req, res) => {
  try {
    const cache = await DashboardCache.findOne({ cacheKey: 'sales_by_company' });
    if (cache && cache.expiresAt > new Date()) {
      return res.json(cache.data);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const orders = await Order.find({ createdAt: { $gte: startOfMonth } }).select('_id');
    const orderIds = orders.map(o => o._id);

    const salesData = await OrderItem.aggregate([
      { $match: { orderId: { $in: orderIds } } },
      { $lookup: { from: 'products', localField: 'productId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.companyId', totalSales: { $sum: '$lineTotal' } } },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      { $project: { _id: 1, totalSales: 1, companyName: '$company.name' } },
      { $sort: { totalSales: -1 } }
    ]);

    const expiresAt = new Date(now.getTime() + 30 * 60000);
    await DashboardCache.findOneAndUpdate(
      { cacheKey: 'sales_by_company' },
      { data: salesData, computedAt: now, expiresAt },
      { upsert: true }
    );

    res.json(salesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching sales by company' });
  }
});

// GET /api/dashboard/monthly-sales
router.get('/monthly-sales', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const fyStartYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const startDate = new Date(fyStartYear, 3, 1); // April 1st

    const monthlySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, 
          sales: { $sum: "$totalValue" } 
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json(monthlySales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching monthly sales' });
  }
});

module.exports = router;
