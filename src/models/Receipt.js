const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    ocrStatus: {
        type: String,
        enum: ['pending', 'processing', 'done', 'failed'],
        default: 'pending'
    },
    ocrResult: {
        type: String
    },
    ocrConfidence: {
        type: Number
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    }
});

// Indexes
receiptSchema.index({ userId: 1 });
receiptSchema.index({ ocrStatus: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);

