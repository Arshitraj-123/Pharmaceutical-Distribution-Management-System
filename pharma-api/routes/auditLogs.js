const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

// Get all audit logs (Admin only)
router.get('/', verifyToken, requireRole('Admin', 'Super Admin', 'Operations Manager', 'Manager'), async (req, res) => {
    try {
        const { limit = 100, page = 1, user, module, action } = req.query;
        const query = {};
        
        if (user) query.user = new RegExp(user, 'i');
        if (module && module !== 'All actions') query.module = module;
        if (action && action !== 'All actions') query.action = new RegExp(action, 'i');

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Export audit logs as CSV (Admin only)
router.get('/export', verifyToken, requireRole('Admin', 'Super Admin', 'Operations Manager', 'Manager'), async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 });
        
        let csvContent = 'Timestamp,User,Action,Module,IP Address,Status\n';
        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString('en-IN');
            // Escape commas in action or user strings
            const user = `"${log.user.replace(/"/g, '""')}"`;
            const action = `"${log.action.replace(/"/g, '""')}"`;
            csvContent += `${date},${user},${action},${log.module},${log.ipAddress},${log.status}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Audit_Logs_Export.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating export' });
    }
});

module.exports = router;
