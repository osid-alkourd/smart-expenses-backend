const mongoose = require('mongoose');
const Expense = require('../models/Expense');

/**
 * Create new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<Object>} - Created expense document
 */
const create = async (expenseData) => {
    const expense = new Expense(expenseData);
    return await expense.save();
};

/**
 * Find expense by ID
 * @param {String} expenseId - Expense ID
 * @returns {Promise<Object|null>} - Expense document or null
 */
const findById = async (expenseId) => {
    return await Expense.findById(expenseId).populate('receiptId');
};

/**
 * Find expenses by user ID
 * @param {String} userId - User ID
 * @param {Object} options - Query options (limit, skip, sort, filter)
 * @returns {Promise<Array>} - Array of expense documents
 */
const findByUserId = async (userId, options = {}) => {
    const { limit = 10, skip = 0, sort = { date: -1 }, filter = {} } = options;
    
    const query = { userId, ...filter };
    
    return await Expense.find(query)
        .populate('receiptId')
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

/**
 * Find expense by receipt ID
 * @param {String} receiptId - Receipt ID
 * @returns {Promise<Object|null>} - Expense document or null
 */
const findByReceiptId = async (receiptId) => {
    return await Expense.findOne({ receiptId }).populate('receiptId');
};

/**
 * Update expense
 * @param {String} expenseId - Expense ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} - Updated expense document or null
 */
const update = async (expenseId, updateData) => {
    return await Expense.findByIdAndUpdate(
        expenseId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
    ).populate('receiptId');
};

/**
 * Delete expense
 * @param {String} expenseId - Expense ID
 * @returns {Promise<Object|null>} - Deleted expense document or null
 */
const deleteById = async (expenseId) => {
    return await Expense.findByIdAndDelete(expenseId);
};

/**
 * Count user expenses
 * @param {String} userId - User ID
 * @param {Object} filter - Optional filter
 * @returns {Promise<Number>} - Count of expenses
 */
const countByUserId = async (userId, filter = {}) => {
    return await Expense.countDocuments({ userId, ...filter });
};

const aggregateYearlyDashboard = async (userId, year) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const [result] = await Expense.aggregate([
        {
            $match: {
                userId: userObjectId,
                date: { $gte: startOfYear, $lt: endOfYear }
            }
        },
        {
            $facet: {
                yearlyTotal: [
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' },
                            expenseCount: { $sum: 1 }
                        }
                    }
                ],
                categoryTotals: [
                    {
                        $group: {
                            _id: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ['$category', null] },
                                            { $eq: ['$category', ''] }
                                        ]
                                    },
                                    'Uncategorized',
                                    '$category'
                                ]
                            },
                            totalAmount: { $sum: '$amount' },
                            expenseCount: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            category: '$_id',
                            totalAmount: 1,
                            expenseCount: 1
                        }
                    },
                    {
                        $sort: { totalAmount: -1 }
                    }
                ],
                monthlyTotals: [
                    {
                        $group: {
                            _id: { month: { $month: '$date' } },
                            totalAmount: { $sum: '$amount' },
                            expenseCount: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            month: '$_id.month',
                            totalAmount: 1,
                            expenseCount: 1
                        }
                    },
                    {
                        $sort: { month: 1 }
                    }
                ]
            }
        }
    ]);

    const yearlyTotalEntry = result?.yearlyTotal?.[0] || {};

    return {
        totalAmount: yearlyTotalEntry.totalAmount || 0,
        expenseCount: yearlyTotalEntry.expenseCount || 0,
        categoryTotals: result?.categoryTotals || [],
        monthlyTotals: result?.monthlyTotals || []
    };
};

const aggregateAllTimeMetrics = async (userId) => {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [result] = await Expense.aggregate([
        {
            $match: { userId: userObjectId }
        },
        {
            $facet: {
                totalExpenses: [
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' },
                            expenseCount: { $sum: 1 }
                        }
                    }
                ],
                distinctCategories: [
                    {
                        $match: {
                            category: { $exists: true, $nin: [null, ''] }
                        }
                    },
                    {
                        $group: { _id: '$category' }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 }
                        }
                    }
                ],
                currentMonthTotal: [
                    {
                        $match: {
                            date: { $gte: startOfCurrentMonth, $lt: startOfNextMonth }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalAmount: { $sum: '$amount' }
                        }
                    }
                ]
            }
        }
    ]);

    const totalExpensesEntry = result?.totalExpenses?.[0] || {};
    const categoryCountEntry = result?.distinctCategories?.[0] || {};
    const currentMonthEntry = result?.currentMonthTotal?.[0] || {};

    return {
        totalAmount: totalExpensesEntry.totalAmount || 0,
        expenseCount: totalExpensesEntry.expenseCount || 0,
        categoryCount: categoryCountEntry.count || 0,
        currentMonthTotal: currentMonthEntry.totalAmount || 0
    };
};

module.exports = {
    create,
    findById,
    findByUserId,
    findByReceiptId,
    update,
    deleteById,
    countByUserId,
    aggregateYearlyDashboard,
    aggregateAllTimeMetrics
};

