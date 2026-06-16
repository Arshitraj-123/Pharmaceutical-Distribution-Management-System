const mongoose = require('mongoose');

const DashboardCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  computedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

DashboardCacheSchema.index({ cacheKey: 1 });
DashboardCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL Index

module.exports = mongoose.model('DashboardCache', DashboardCacheSchema);
