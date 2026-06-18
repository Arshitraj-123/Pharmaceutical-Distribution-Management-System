const mongoose = require('mongoose');

const DispatchSchema = new mongoose.Schema({
  runId: { type: String, required: true, unique: true },
  driver: { type: String, required: true },
  beat: { type: String, required: true },
  vehicle: { type: String },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  status: { type: String, enum: ['Pending', 'In Transit', 'Completed'], default: 'Pending' },
  dispatchedAt: { type: Date },
  completedAt: { type: Date },
  cashCollected: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes
DispatchSchema.index({ createdAt: -1 });
DispatchSchema.index({ status: 1 });
DispatchSchema.index({ beat: 1 });

module.exports = mongoose.model('Dispatch', DispatchSchema);
