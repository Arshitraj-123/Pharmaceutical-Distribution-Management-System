const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  schemeId: { type: String, required: true, unique: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Optional, null means company-wide
  type: { type: String, enum: ['Free Goods', 'Discount'], required: true },
  details: {
    buyQty: { type: Number },
    freeQty: { type: Number },
    discountPercent: { type: Number }
  },
  validUntil: { type: Date, required: true },
  utilisedValue: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
SchemeSchema.index({ companyId: 1 });
SchemeSchema.index({ productId: 1 });
SchemeSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Scheme', SchemeSchema);
