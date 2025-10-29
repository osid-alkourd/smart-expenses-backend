const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const settingsSchema = new mongoose.Schema({
    currency: {
        type: String,
        default: 'USD'
    },
    language: {
        type: String,
        default: 'en'
    },
    theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
    },
    monthlyBudget: {
        type: Number,
        optional: true
    }
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    avatarUrl: {
        type: String,
        optional: true
    },
    roles: {
        type: [String],
        default: ['user']
    },
    isEmailConfirmed: {
        type: Boolean,
        default: false
    },
    emailConfirmToken: {
        type: String,
        optional: true
    },
    emailConfirmTokenIssuedAt: {
        type: Date,
        optional: true
    },
    passwordResetToken: {
        type: String,
        optional: true
    },
    passwordResetTokenIssuedAt: {
        type: Date,
        optional: true
    },
    settings: {
        type: settingsSchema,
        default: () => ({})
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

