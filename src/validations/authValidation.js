const { body, validationResult } = require('express-validator');

// Validation rules for user registration
const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// Validation rules for user login
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Validation rules for email confirmation
const emailConfirmValidation = [
    body('token')
        .notEmpty()
        .withMessage('Token is required')
        .trim()
];

// Validation rules for update profile
const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('newPassword')
        .optional()
        .notEmpty()
        .withMessage('New password is required when updating password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
        .custom((value, { req }) => {
            if (value && !req.body.confirmPassword) {
                throw new Error('Confirm password is required when updating password');
            }
            return true;
        }),
    body('confirmPassword')
        .optional()
        .notEmpty()
        .withMessage('Confirm password is required when updating password')
        .custom((value, { req }) => {
            if (req.body.newPassword && value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            if (value && !req.body.newPassword) {
                throw new Error('New password is required when confirming password');
            }
            return true;
        })
];

// Validation rules for forget password
const forgetPasswordValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
];

// Validation rules for reset password
const resetPasswordValidation = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Verification code is required')
        .isLength({ min: 7, max: 7 })
        .withMessage('Verification code must be exactly 7 digits')
        .matches(/^\d+$/)
        .withMessage('Verification code must contain only numbers'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path || err.param,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    emailConfirmValidation,
    updateProfileValidation,
    forgetPasswordValidation,
    resetPasswordValidation,
    handleValidationErrors
};

