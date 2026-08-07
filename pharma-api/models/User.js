const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  empId: { type: String },
  role: { type: String },
  branch: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  deactivatedAt: { type: Date },
  deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
