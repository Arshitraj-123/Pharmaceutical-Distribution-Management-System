const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const Settings = require('../models/Settings');
const { logAction } = require('../utils/audit');

// Utility to get or upsert the settings singleton
const getSettings = async () => {
  return await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: {
      businessName: 'Aadhya Pharmex',
      address: '123 Pharma Hub, Kankarbagh, Patna, Bihar 800020',
      gstin: '10AAAAA1234A1Z5',
      drugLicense: 'DL-BR-PAT-123456',
      state: 'Bihar',
      stateCode: '10',
      bankDetails: {
        accountName: 'Aadhya Pharmex Current A/C',
        accountNumber: '123456789012',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank, Kankarbagh Branch'
      },
      gstConfig: {
        eInvoiceEnabled: false,
        eWayBillThreshold: 50000,
        gstr1FilingFreq: 'monthly',
        taxComputation: 'exclusive',
        roundOffMethod: 'nearest'
      },
      securityPolicy: {
        minPasswordLen: 8,
        passwordExpiryDays: 90,
        sessionTimeout: 60,
        maxConcurrentLogins: 2,
        failedLoginLockout: 5
      }
    }},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

router.use(verifyToken);

// GET global settings singleton
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected routes (Admin / Manager)
router.use(requireRole('Super Admin', 'Operations Manager', 'Manager', 'Admin'));

// PUT /company
router.put('/company', async (req, res) => {
  try {
    const settings = await getSettings();
    Object.assign(settings, req.body);
    await settings.save();
    logAction({ user: req.user.email, action: 'Updated company info', module: 'Settings', ipAddress: req.ip });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /gst
router.put('/gst', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.gstConfig = req.body.gstConfig;
    await settings.save();
    logAction({ user: req.user.email, action: 'Updated GST configuration', module: 'Settings', ipAddress: req.ip });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /notifications
router.put('/notifications', async (req, res) => {
  try {
    const settings = await getSettings();
    settings.notificationConfig = req.body.notificationConfig;
    await settings.save();
    logAction({ user: req.user.email, action: 'Updated notification preferences', module: 'Settings', ipAddress: req.ip });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Super Admin Only
router.put('/security', requireRole('Super Admin', 'Admin'), async (req, res) => {
  try {
    const settings = await getSettings();
    settings.securityPolicy = req.body.securityPolicy;
    await settings.save();
    logAction({ user: req.user.email, action: 'Updated security policy', module: 'Settings', ipAddress: req.ip });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export all company data (DPDP Compliance)
router.get('/export', requireRole('Super Admin', 'Admin', 'Operations Manager', 'Manager'), async (req, res) => {
  try {
    const settings = await Settings.findOne();
    const User = require('../models/User');
    const users = await User.find().select('-password');
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find();

    const exportData = {
      generatedAt: new Date(),
      requestedBy: req.user.email,
      settings,
      users,
      auditLogs: logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="Company_Data_Export.json"');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error exporting data' });
  }
});

module.exports = router;
