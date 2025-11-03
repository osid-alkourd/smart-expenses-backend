const expenseRepository = require('../repositories/expenseRepository');
const receiptRepository = require('../repositories/receiptRepository');

/**
 * Create expense from OCR data
 * @param {Object} expenseData - Expense data
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Created expense document
 */
const createExpense = async (expenseData, userId) => {
    // Validate required fields
    if (!expenseData.receiptId) {
        const error = new Error('Receipt ID is required');
        error.statusCode = 400;
        throw error;
    }

    if (!expenseData.amount) {
        const error = new Error('Amount is required');
        error.statusCode = 400;
        throw error;
    }

    if (!expenseData.date) {
        const error = new Error('Date is required');
        error.statusCode = 400;
        throw error;
    }

    // Verify receipt belongs to user
    const receipt = await receiptRepository.findById(expenseData.receiptId);
    if (!receipt) {
        const error = new Error('Receipt not found');
        error.statusCode = 404;
        throw error;
    }

    if (receipt.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    // Check if expense already exists for this receipt
    const existingExpense = await expenseRepository.findByReceiptId(expenseData.receiptId);
    if (existingExpense) {
        const error = new Error('Expense already exists for this receipt');
        error.statusCode = 409;
        throw error;
    }

    // Create expense
    const expense = await expenseRepository.create({
        userId,
        ...expenseData,
        isVerified: false
    });

    return expense;
};

/**
 * Get expense by ID
 * @param {String} expenseId - Expense ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Expense document
 */
const getExpenseById = async (expenseId, userId) => {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
        const error = new Error('Expense not found');
        error.statusCode = 404;
        throw error;
    }

    if (expense.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    return expense;
};

/**
 * Get user expenses with pagination and filters
 * @param {String} userId - User ID
 * @param {Object} options - Query options (page, limit, category, startDate, endDate)
 * @returns {Promise<Object>} - Expenses and pagination info
 */
const getUserExpenses = async (userId, options = {}) => {
    const { page = 1, limit = 10, category, startDate, endDate } = options;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (category) {
        filter.category = category;
    }
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
            filter.date.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.date.$lte = new Date(endDate);
        }
    }

    const expenses = await expenseRepository.findByUserId(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip),
        filter
    });

    const total = await expenseRepository.countByUserId(userId, filter);

    return {
        expenses,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Update expense
 * @param {String} expenseId - Expense ID
 * @param {Object} updateData - Data to update
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Updated expense document
 */
const updateExpense = async (expenseId, updateData, userId) => {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
        const error = new Error('Expense not found');
        error.statusCode = 404;
        throw error;
    }

    if (expense.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    // Update expense
    const updatedExpense = await expenseRepository.update(expenseId, updateData);

    return updatedExpense;
};

/**
 * Delete expense
 * @param {String} expenseId - Expense ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Deleted expense document
 */
const deleteExpense = async (expenseId, userId) => {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
        const error = new Error('Expense not found');
        error.statusCode = 404;
        throw error;
    }

    if (expense.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    await expenseRepository.deleteById(expenseId);

    return expense;
};

module.exports = {
    createExpense,
    getExpenseById,
    getUserExpenses,
    updateExpense,
    deleteExpense
};

