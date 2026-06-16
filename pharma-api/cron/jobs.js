const cron = require('node-cron');
const Order = require('../models/Order');
const DashboardCache = require('../models/DashboardCache');
const Inventory = require('../models/Inventory');
const Retailer = require('../models/Retailer');
const Notification = require('../models/Notification');

// Job 1: Every 30 mins -> Recompute sales charts
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Recomputing dashboard sales aggregations...');
  try {
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
    console.log('[CRON] Dashboard sales aggregations cached.');
  } catch (error) {
    console.error('[CRON Error] Failed to compute sales:', error);
  }
});

// Job 2: Every 1 hour -> Check expiry dates & license dates
cron.schedule('0 * * * *', async () => {
  console.log('[CRON] Checking expiry & license dates...');
  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const expiringInventory = await Inventory.find({ expiryDate: { $lte: nextMonth } }).populate('productId');
    
    for (const item of expiringInventory) {
      await Notification.create({
        type: 'Warning',
        title: 'Expiring Inventory',
        message: `Batch ${item.batchNo} for ${item.productId?.tradeName || 'Product'} is expiring on ${item.expiryDate.toISOString().split('T')[0]}`,
        module: 'Inventory',
        priority: 1
      });
    }

    const expiringRetailers = await Retailer.find({ licenseExpiry: { $lte: nextMonth } });

    for (const ret of expiringRetailers) {
      await Notification.create({
        type: 'Warning',
        title: 'License Expiry',
        message: `Drug license for ${ret.name} expires on ${ret.licenseExpiry.toISOString().split('T')[0]}`,
        module: 'Compliance',
        priority: 2
      });
    }
    console.log('[CRON] Notification checks complete.');
  } catch (error) {
    console.error('[CRON Error] Failed to check expiries:', error);
  }
});
