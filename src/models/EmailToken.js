const mongoose = require('mongoose');

const emailTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['email_confirm', 'password_reset'],
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Indexes
emailTokenSchema.index({ userId: 1 });
emailTokenSchema.index({ token: 1 });
emailTokenSchema.index({ userId: 1, type: 1 });
emailTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired tokens

module.exports = mongoose.model('EmailToken', emailTokenSchema);

