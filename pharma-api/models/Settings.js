const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  legalName: { type: String },
  tradeName: { type: String },
  phone: { type: String },
  constitution: { type: String },
  registrationNumber: { type: String },
  registrationDate: { type: Date },
  address: { type: String, required: true },
  gstin: { type: String, required: true },
  drugLicense: { type: String, required: true },
  state: { type: String, required: true },
  stateCode: { type: String, required: true },
  bankDetails: {
    accountName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    bankName: { type: String }
  },
  gstConfig: {
    eInvoiceEnabled: { type: Boolean, default: false },
    irpProvider: { type: String, default: 'NIC' },
    eWayBillThreshold: { type: Number, default: 50000 },
    gstr1FilingFreq: { type: String, default: 'monthly' },
    taxComputation: { type: String, default: 'exclusive' },
    gstr1Reminder: { type: Boolean, default: true },
    itcTracking: { type: Boolean, default: true },
    hsnMandatory: { type: Boolean, default: true },
    roundOffMethod: { type: String, default: 'nearest' }
  },
  notificationConfig: {
    channels: {
      orderPlaced: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
      nearExpiry: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
      stockOut: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
      paymentOverdue: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
      dlExpiry: { inApp: { type: Boolean, default: true }, email: { type: Boolean, default: true }, sms: { type: Boolean, default: false } }
    },
    thresholds: {
      nearExpiryDays: { type: Number, default: 90 },
      dlExpiryDays: { type: Number, default: 30 },
      paymentReminderDays: { type: Number, default: 3 },
      paymentOverdueEvery: { type: Number, default: 7 }
    },
    digests: {
      dailySales: { type: Boolean, default: true },
      weeklyOut: { type: Boolean, default: true },
      weeklyExp: { type: Boolean, default: true },
      monthlyGst: { type: Boolean, default: true }
    },
    recipients: [{ type: String }]
  },
  securityPolicy: {
    minPasswordLen: { type: Number, default: 8 },
    passwordExpiryDays: { type: Number, default: 90 },
    sessionTimeout: { type: Number, default: 60 },
    maxConcurrentLogins: { type: Number, default: 2 },
    failedLoginLockout: { type: Number, default: 5 },
    ipWhitelist: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
