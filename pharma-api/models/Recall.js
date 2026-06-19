const mongoose = require('mongoose');

const RecallSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  batchNo: { type: String, required: true },
  noticeDate: { type: Date, required: true },
  affectedRetailersCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Recall', RecallSchema);
