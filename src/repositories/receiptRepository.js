const Receipt = require('../models/Receipt');

/**
 * Create new receipt
 * @param {Object} receiptData - Receipt data
 * @returns {Promise<Object>} - Created receipt document
 */
const create = async (receiptData) => {
    const receipt = new Receipt(receiptData);
    return await receipt.save();
};

/**
 * Find receipt by ID
 * @param {String} receiptId - Receipt ID
 * @returns {Promise<Object|null>} - Receipt document or null
 */
const findById = async (receiptId) => {
    return await Receipt.findById(receiptId);
};

/**
 * Find receipts by user ID
 * @param {String} userId - User ID
 * @param {Object} options - Query options (limit, skip, sort)
 * @returns {Promise<Array>} - Array of receipt documents
 */
const findByUserId = async (userId, options = {}) => {
    const { limit = 10, skip = 0, sort = { uploadedAt: -1 } } = options;
    
    return await Receipt.find({ userId })
        .sort(sort)
        .limit(limit)
        .skip(skip);
};

/**
 * Update receipt
 * @param {String} receiptId - Receipt ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} - Updated receipt document or null
 */
const update = async (receiptId, updateData) => {
    return await Receipt.findByIdAndUpdate(
        receiptId,
        updateData,
        { new: true, runValidators: true }
    );
};

/**
 * Delete receipt
 * @param {String} receiptId - Receipt ID
 * @returns {Promise<Object|null>} - Deleted receipt document or null
 */
const deleteById = async (receiptId) => {
    return await Receipt.findByIdAndDelete(receiptId);
};

/**
 * Count user receipts
 * @param {String} userId - User ID
 * @returns {Promise<Number>} - Count of receipts
 */
const countByUserId = async (userId) => {
    return await Receipt.countDocuments({ userId });
};

module.exports = {
    create,
    findById,
    findByUserId,
    update,
    deleteById,
    countByUserId
};
