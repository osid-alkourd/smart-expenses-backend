const mongoose = require('mongoose');

const tokenSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refreshTokenHash: {
        type: String,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Indexes
tokenSessionSchema.index({ userId: 1 });
tokenSessionSchema.index({ refreshTokenHash: 1 });
tokenSessionSchema.index({ userId: 1, isActive: 1 });
tokenSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired sessions

module.exports = mongoose.model('TokenSession', tokenSessionSchema);

