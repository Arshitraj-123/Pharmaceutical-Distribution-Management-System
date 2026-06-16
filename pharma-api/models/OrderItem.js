const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  qtyOrdered: { type: Number, required: true },
  qtySupplied: { type: Number, default: 0 },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, required: true },
  lineTotal: { type: Number, required: true }
});

OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });

module.exports = mongoose.model('OrderItem', OrderItemSchema);
