const { param, query, validationResult } = require('express-validator');

// Validation rules for getting receipt by ID
const getReceiptValidation = [
    param('id')
        .notEmpty()
        .withMessage('Receipt ID is required')
        .isMongoId()
        .withMessage('Invalid receipt ID format')
];

// Validation rules for pagination
const paginationValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
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
    getReceiptValidation,
    paginationValidation,
    handleValidationErrors
};
