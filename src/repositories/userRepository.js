const User = require('../models/User');

/**
 * Find user by email
 * @param {String} email - User email
 * @returns {Promise<Object|null>} - User document or null
 */
const findByEmail = async (email) => {
    return await User.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Find user by ID
 * @param {String} userId - User ID
 * @returns {Promise<Object|null>} - User document or null
 */
const findById = async (userId) => {
    return await User.findById(userId);
};

/**
 * Create new user
 * @param {Object} userData - User data (name, email, password)
 * @returns {Promise<Object>} - Created user document
 */
const create = async (userData) => {
    const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password
    });
    return await user.save();
};

/**
 * Update user
 * @param {String} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object|null>} - Updated user document or null
 */
const update = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
    );
};

/**
 * Verify user email
 * @param {String} userId - User ID
 * @returns {Promise<Object|null>} - Updated user document or null
 */
const verifyEmail = async (userId) => {
    return await User.findByIdAndUpdate(
        userId,
        { isEmailConfirmed: true, updatedAt: Date.now() },
        { new: true }
    );
};

module.exports = {
    findByEmail,
    findById,
    create,
    update,
    verifyEmail
};

