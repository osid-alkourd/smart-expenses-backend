const expenseService = require('../services/expenseService');

/**
 * Create expense manually
 * POST /api/expenses
 */
const createExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseData = req.body;

        const expense = await expenseService.createExpense(expenseData, userId);

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: {
                expense
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to create expense';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Get expense by ID with related receipt information
 * GET /api/expenses/:id
 */
const getExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseId = req.params.id;

        const expense = await expenseService.getExpenseById(expenseId, userId);

        res.status(200).json({
            success: true,
            data: {
                expense
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to fetch expense';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Get user expenses
 * GET /api/expenses
 */
const getUserExpenses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page, limit, category, startDate, endDate } = req.query;

        const result = await expenseService.getUserExpenses(userId, {
            page,
            limit,
            category,
            startDate,
            endDate
        });

        res.status(200).json({
            success: true,
            data: {
                expenses: result.expenses,
                pagination: result.pagination
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to fetch expenses';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Update expense
 * PUT /api/expenses/:id
 */
const updateExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseId = req.params.id;
        const updateData = req.body;

        const expense = await expenseService.updateExpense(expenseId, updateData, userId);

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: {
                expense
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to update expense';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Delete expense
 * DELETE /api/expenses/:id
 */
const deleteExpense = async (req, res) => {
    try {
        const userId = req.user.userId;
        const expenseId = req.params.id;

        await expenseService.deleteExpense(expenseId, userId);

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to delete expense';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { year } = req.query;

        const dashboard = await expenseService.getDashboardSummary(userId, year);

        res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to fetch dashboard metrics';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

module.exports = {
    createExpense,
    getExpense,
    getUserExpenses,
    updateExpense,
    deleteExpense,
    getDashboardSummary
};

