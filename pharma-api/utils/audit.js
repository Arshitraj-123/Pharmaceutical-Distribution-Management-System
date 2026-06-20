const AuditLog = require('../models/AuditLog');

/**
 * Asynchronously logs an action to the AuditLog collection.
 * Designed to not block the main execution thread.
 * 
 * @param {Object} options
 * @param {String} options.user Name, email, or "System"
 * @param {String} options.action The action performed
 * @param {String} options.module The module name (Auth, Settings, etc)
 * @param {String} options.ipAddress IP of the request
 * @param {String} options.status "Success" or "Failed"
 * @param {Object} options.details Additional metadata
 */
const logAction = ({ user, action, module, ipAddress, status = 'Success', details = {} }) => {
    try {
        // Fire and forget, catch errors internally to prevent crashing the main flow
        AuditLog.create({
            user: user || 'Unknown',
            action,
            module,
            ipAddress: ipAddress || 'Unknown',
            status,
            details
        }).catch(err => {
            console.error('Failed to write audit log (async):', err);
        });
    } catch (err) {
        console.error('Failed to write audit log (sync):', err);
    }
};

module.exports = { logAction };
