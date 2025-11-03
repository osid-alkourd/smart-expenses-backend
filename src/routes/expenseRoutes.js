const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { auth } = require('../middleware/auth');
const {
    createExpenseValidation,
    updateExpenseValidation,
    expenseIdValidation,
    expenseFilterValidation,
    handleValidationErrors
} = require('../validations/expenseValidation');

/**
 * @route   POST /api/expenses
 * @desc    Create expense manually
 * @access  Private
 */
router.post('/', auth, createExpenseValidation, handleValidationErrors, expenseController.createExpense);

/**
 * @route   GET /api/expenses
 * @desc    Get user expenses with filters
 * @access  Private
 */
router.get('/', auth, expenseFilterValidation, handleValidationErrors, expenseController.getUserExpenses);

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
router.get('/:id', auth, expenseIdValidation, handleValidationErrors, expenseController.getExpense);

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense
 * @access  Private
 */
router.put('/:id', auth, updateExpenseValidation, handleValidationErrors, expenseController.updateExpense);

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense
 * @access  Private
 */
router.delete('/:id', auth, expenseIdValidation, handleValidationErrors, expenseController.deleteExpense);

module.exports = router;

