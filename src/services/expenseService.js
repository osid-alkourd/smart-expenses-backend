const expenseRepository = require('../repositories/expenseRepository');
const receiptRepository = require('../repositories/receiptRepository');
const receiptService = require('./receiptService');

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
 * Get expense by ID with related receipt information
 * @param {String} expenseId - Expense ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Expense document with populated receipt information
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

    // Ensure receipt is populated (it should be from repository, but double-check)
    if (!expense.receiptId || typeof expense.receiptId === 'string') {
        // If receipt is not populated, populate it
        await expense.populate('receiptId');
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
 * Delete expense and related receipt
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

    // Store receipt ID before deleting expense
    const receiptId = expense.receiptId?._id || expense.receiptId;

    // Delete the expense first
    await expenseRepository.deleteById(expenseId);

    // Delete the related receipt if it exists (this will also delete from Cloudinary)
    if (receiptId) {
        try {
            // Use receiptService to ensure Cloudinary file is also deleted
            await receiptService.deleteReceipt(receiptId.toString(), userId);
            console.log(`✅ Successfully deleted receipt and Cloudinary file: ${receiptId}`);
        } catch (error) {
            // Log error but don't fail the expense deletion if receipt deletion fails
            // The expense is already deleted, so we just log the error
            console.error('Error deleting related receipt:', error);
        }
    }

    return expense;
};

const getDashboardSummary = async (userId, year) => {
    const currentYear = new Date().getFullYear();
    const numericYear = year ? Number(year) : currentYear;

    if (!Number.isInteger(numericYear) || numericYear < 1900) {
        const error = new Error('Year must be a valid integer (e.g., 2025)');
        error.statusCode = 400;
        throw error;
    }

    const [yearlyMetrics, allTimeMetrics] = await Promise.all([
        expenseRepository.aggregateYearlyDashboard(userId, numericYear),
        expenseRepository.aggregateAllTimeMetrics(userId)
    ]);

    const { totalAmount: yearlyTotal, expenseCount: yearlyExpenseCount, categoryTotals, monthlyTotals } = yearlyMetrics;

    const categoryBreakdown = (categoryTotals || []).map((item) => ({
        category: item.category,
        totalAmount: item.totalAmount,
        expenseCount: item.expenseCount,
        percentageOfYear: yearlyTotal > 0 ? (item.totalAmount / yearlyTotal) * 100 : 0
    }));

    const topCategoryEntry = categoryBreakdown[0] || null;
    const topCategory = topCategoryEntry
        ? {
            name: topCategoryEntry.category,
            totalAmount: topCategoryEntry.totalAmount,
            percentageOfYear: topCategoryEntry.percentageOfYear
        }
        : null;

    const monthlyTotalsMap = new Map(
        (monthlyTotals || []).map((item) => [item.month, item])
    );

    const monthlyComparison = Array.from({ length: 12 }, (_, index) => {
        const monthNumber = index + 1;
        const monthData = monthlyTotalsMap.get(monthNumber) || { totalAmount: 0, expenseCount: 0 };
        const averagePerExpense = monthData.expenseCount ? monthData.totalAmount / monthData.expenseCount : 0;
        const daysInMonth = new Date(numericYear, monthNumber, 0).getDate();
        const averagePerDay = daysInMonth ? monthData.totalAmount / daysInMonth : 0;

        return {
            month: monthNumber,
            totalAmount: monthData.totalAmount,
            averagePerExpense,
            averagePerDay,
            expenseCount: monthData.expenseCount
        };
    });

    const averageMonthlySpending = yearlyTotal / 12;

    return {
        selectedYear: numericYear,
        yearlySummary: {
            totalAmount: yearlyTotal,
            expenseCount: yearlyExpenseCount,
            averageMonthlySpending
        },
        topCategory,
        categoryBreakdown,
        monthlyComparison,
        allTimeSummary: {
            totalAmount: allTimeMetrics.totalAmount,
            expenseCount: allTimeMetrics.expenseCount,
            categoryCount: allTimeMetrics.categoryCount,
            currentMonthTotal: allTimeMetrics.currentMonthTotal
        }
    };
};

module.exports = {
    createExpense,
    getExpenseById,
    getUserExpenses,
    updateExpense,
    deleteExpense,
    getDashboardSummary
};

