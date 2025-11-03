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

module.exports = {
    create,
    findById,
    findByUserId,
    findByReceiptId,
    update,
    deleteById,
    countByUserId
};

