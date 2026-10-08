const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google-only users
  phone: { type: String },
  empId: { type: String },
  role: { type: String },
  branch: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  deactivatedAt: { type: Date },
  deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer' },
  googleId: { type: String, sparse: true, index: true },
  authProvider: { type: String, enum: ['local', 'google', 'both'], default: 'local' },
  profilePhoto: { type: String },
  address: { type: String },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
