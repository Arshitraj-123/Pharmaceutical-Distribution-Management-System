const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  forLogin: { type: Boolean, default: false },
  forSignup: { type: Boolean, default: false },
  signupData: { type: Object },
  verified: { type: Boolean, default: false },
  // This automatically deletes the document after 600 seconds (10 minutes)
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

module.exports = mongoose.model('Otp', otpSchema);
