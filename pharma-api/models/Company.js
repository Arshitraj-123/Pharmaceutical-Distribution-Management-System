const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  gstin: { type: String },
  creditDays: { type: Number, default: 30 },
  contactPerson: { type: String },
  phone: { type: String },
  email: { type: String },
  totalPurchaseMTD: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
