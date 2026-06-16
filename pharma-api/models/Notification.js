const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, if system-wide
  type: { type: String, enum: ['Alert', 'Warning', 'Info', 'Success'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  module: { type: String },
  read: { type: Boolean, default: false },
  priority: { type: Number, default: 0 }, // 0: low, 1: medium, 2: high
  expiresAt: { type: Date }
}, { timestamps: true });

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL Index

module.exports = mongoose.model('Notification', NotificationSchema);
