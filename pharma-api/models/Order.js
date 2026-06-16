const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
  totalValue: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'], default: 'Pending' },
  paymentMode: { type: String, enum: ['Cash', 'Credit', 'UPI', 'Bank Transfer'], default: 'Credit' },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }
}, { timestamps: true });

// Indexes for fast aggregations
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ retailerId: 1 });

module.exports = mongoose.model('Order', OrderSchema);
