const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  tradeName: { type: String, required: true },
  genericName: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  category: { type: String },
  schedule: { type: String },
  hsnCode: { type: String },
  gstRate: { type: Number, default: 0 },
  mrp: { type: Number, required: true },
  ptr: { type: Number, required: true },
  priceTiers: [{ 
    tier: String, 
    price: Number 
  }]
}, { timestamps: true });

ProductSchema.index({ sku: 1 });
ProductSchema.index({ tradeName: 1 });
ProductSchema.index({ companyId: 1 });

module.exports = mongoose.model('Product', ProductSchema);
