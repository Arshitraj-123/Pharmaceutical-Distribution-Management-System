const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        description: 'Name or email of the user, or System/Unknown'
    },
    action: {
        type: String,
        required: true
    },
    module: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        default: 'Unknown'
    },
    status: {
        type: String,
        enum: ['Success', 'Failed'],
        default: 'Success'
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
