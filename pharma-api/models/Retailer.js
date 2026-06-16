const mongoose = require('mongoose');

const RetailerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String },
  gstin: { type: String },
  drugLicense: { type: String },
  licenseExpiry: { type: Date },
  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 },
  tier: { type: String, enum: ['Standard', 'Silver', 'Gold', 'Platinum'], default: 'Standard' },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  outstandingBalance: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for fast aggregations
RetailerSchema.index({ status: 1 });
RetailerSchema.index({ licenseExpiry: 1 });

module.exports = mongoose.model('Retailer', RetailerSchema);
