const { body, param, query, validationResult } = require('express-validator');

// Validation rules for creating expense
const createExpenseValidation = [
    body('receiptId')
        .notEmpty()
        .withMessage('Receipt ID is required')
        .isMongoId()
        .withMessage('Invalid receipt ID format'),
    body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('date')
        .notEmpty()
        .withMessage('Date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
    body('merchant')
        .optional()
        .isString()
        .withMessage('Merchant must be a string'),
    body('category')
        .optional()
        .isString()
        .withMessage('Category must be a string'),
    body('currency')
        .optional()
        .isString()
        .isLength({ min: 3, max: 3 })
        .withMessage('Currency must be a 3-letter code'),
    body('paymentMethod')
        .optional()
        .isString()
        .withMessage('Payment method must be a string'),
    body('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
];

// Validation rules for updating expense
const updateExpenseValidation = [
    param('id')
        .notEmpty()
        .withMessage('Expense ID is required')
        .isMongoId()
        .withMessage('Invalid expense ID format'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
    body('merchant')
        .optional()
        .isString()
        .withMessage('Merchant must be a string'),
    body('category')
        .optional()
        .isString()
        .withMessage('Category must be a string'),
    body('isVerified')
        .optional()
        .isBoolean()
        .withMessage('isVerified must be a boolean')
];

// Validation rules for expense ID param
const expenseIdValidation = [
    param('id')
        .notEmpty()
        .withMessage('Expense ID is required')
        .isMongoId()
        .withMessage('Invalid expense ID format')
];

// Validation rules for expense query filters
const expenseFilterValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('category')
        .optional()
        .isString()
        .withMessage('Category must be a string'),
    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format')
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
    createExpenseValidation,
    updateExpenseValidation,
    expenseIdValidation,
    expenseFilterValidation,
    handleValidationErrors
};

