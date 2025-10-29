const mongoose = require('mongoose');

const parsedDataSchema = new mongoose.Schema({
    parsedMerchant: {
        type: String
    },
    parsedDate: {
        type: Date
    },
    parsedAmount: {
        type: Number
    }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    merchant: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    date: {
        type: Date,
        required: true
    },
    category: {
        type: String
    },
    paymentMethod: {
        type: String
    },
    receiptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Receipt',
        required: true
    },
    ocrText: {
        type: String
    },
    parsedData: {
        type: parsedDataSchema,
        default: () => ({})
    },
    notes: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
expenseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Indexes
expenseSchema.index({ userId: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ receiptId: 1 });
expenseSchema.index({ userId: 1, date: -1 }); // Query recent expenses per user
expenseSchema.index({ userId: 1, category: 1, date: -1 }); // Category filters
expenseSchema.index({ ocrText: "text", merchant: "text", notes: "text" }); // Full-text search
expenseSchema.index({ userId: 1, amount: 1 }); // Query by amounts

module.exports = mongoose.model('Expense', expenseSchema);

