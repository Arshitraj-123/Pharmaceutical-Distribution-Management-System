const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem' }],
  totalValue: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Out for Delivery', 'Delivered', 'Cancelled', 'Credit Hold'], default: 'Pending' },
  paymentMode: { type: String, enum: ['Cash', 'Credit', 'UPI', 'Bank Transfer', 'Online'], default: 'Credit' },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  dispatchedAt: { type: Date },
  deliveredAt: { type: Date },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  tracking: {
    carrier: { type: String, default: 'Aadya Express Logistics' },
    trackingNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    vehicle: { type: String },
    estimatedDelivery: { type: Date }
  },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    comment: { type: String }
  }],
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  cancelledBy: { type: String }
}, { timestamps: true });

// Indexes for fast aggregations
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ retailerId: 1 });

module.exports = mongoose.model('Order', OrderSchema);

