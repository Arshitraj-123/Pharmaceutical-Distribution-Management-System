const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchNo: { type: String, required: true },
  mfgDate: { type: Date },
  expiryDate: { type: Date, required: true },
  qtyAvailable: { type: Number, default: 0 },
  rackLocation: { type: String },
  costPrice: { type: Number }
}, { timestamps: true });

// Indexes for fast aggregations
InventorySchema.index({ productId: 1 });
InventorySchema.index({ expiryDate: 1 });
InventorySchema.index({ qtyAvailable: 1 });

module.exports = mongoose.model('Inventory', InventorySchema);
