const crypto = require('crypto');
const EmailToken = require('../models/EmailToken');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');

/**
 * Generate secure random token
 * @returns {String} - Secure random token
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Create email confirmation token
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - EmailToken document
 */
const createEmailConfirmationToken = async (userId) => {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    const emailToken = new EmailToken({
        userId,
        type: 'email_confirm',
        token,
        expiresAt
    });

    return await emailToken.save();
};

/**
 * Register new user
 * @param {Object} userData - User registration data (name, email, password)
 * @returns {Promise<Object>} - Created user object (without password)
 */
const register = async (userData) => {
    // Check if user already exists
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
        const error = new Error('User with this email already exists');
        error.statusCode = 409;
        throw error;
    }

    // Create new user
    const user = await userRepository.create({
        name: userData.name,
        email: userData.email,
        password: userData.password
    });

    // Generate email confirmation token
    const emailToken = await createEmailConfirmationToken(user._id);

    // Send confirmation email
    try {
        await emailService.sendEmailConfirmation(user.email, user.name, emailToken.token);
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        // Continue even if email fails - token is already saved
    }

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};

/**
 * Verify email token
 * @param {String} token - Email confirmation token
 * @returns {Promise<Object>} - Updated user object
 */
const verifyEmailToken = async (token) => {
    const emailToken = await EmailToken.findOne({
        token,
        type: 'email_confirm'
    });

    if (!emailToken) {
        const error = new Error('Invalid or expired token');
        error.statusCode = 400;
        throw error;
    }

    if (new Date() > emailToken.expiresAt) {
        const error = new Error('Token has expired');
        error.statusCode = 400;
        throw error;
    }

    // Verify user email
    const user = await userRepository.verifyEmail(emailToken.userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Delete the used token
    await EmailToken.deleteOne({ _id: emailToken._id });

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
};

module.exports = {
    register,
    verifyEmailToken,
    generateToken
};


