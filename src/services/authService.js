const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const EmailToken = require('../models/EmailToken');
const userRepository = require('../repositories/userRepository');
const emailService = require('./emailService');
const cloudinary = require('../config/cloudinary');
const { JWT_SECRET } = require('../config/env');

/**
 * Generate secure random token
 * @returns {String} - Secure random token
 */
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate 7-digit verification code
 * @returns {String} - 7-digit code
 */
const generateVerificationCode = () => {
    return Math.floor(1000000 + Math.random() * 9000000).toString();
};

/**
 * Generate JWT access token
 * @param {String} userId - User ID
 * @returns {String} - JWT token
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
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
 * Create password reset token
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - EmailToken document
 */
const createPasswordResetToken = async (userId) => {
    // Delete any existing password reset tokens for this user
    await EmailToken.deleteMany({ userId, type: 'password_reset' });

    const code = generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    const emailToken = new EmailToken({
        userId,
        type: 'password_reset',
        token: code,
        expiresAt
    });

    return await emailToken.save();
};

/**
 * Register new user
 * @param {Object} userData - User registration data (name, email, password)
 * @returns {Promise<Object>} - Created user object (without password) and access token
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

    // Generate access token for immediate login
    const accessToken = generateAccessToken(user._id.toString());

    // Return user without password and access token
    const userObj = user.toObject();
    delete userObj.password;
    
    return {
        user: userObj,
        accessToken
    };
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

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Promise<Object>} - User object and access token
 */
const login = async (email, password) => {
    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // Generate access token
    const accessToken = generateAccessToken(user._id.toString());

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return {
        user: userObj,
        accessToken
    };
};

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Original file name
 * @param {String} mimeType - File MIME type
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadImageToCloudinary = (fileBuffer, fileName, mimeType, userId) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: `avatars/${userId}`,
            resource_type: 'image',
            public_id: `avatar_${Date.now()}`,
            transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' }
            ]
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Update user profile
 * @param {String} userId - User ID
 * @param {Object} updateData - Data to update (name, newPassword, image file)
 * @returns {Promise<Object>} - Updated user object (without password)
 */
const updateProfile = async (userId, updateData) => {
    const { name, newPassword, confirmPassword, file } = updateData;
    
    // Validate password fields if password update is requested
    if (newPassword || confirmPassword) {
        if (!newPassword || !confirmPassword) {
            const error = new Error('Both new password and confirm password are required to update password');
            error.statusCode = 400;
            throw error;
        }
        
        if (newPassword !== confirmPassword) {
            const error = new Error('Passwords do not match');
            error.statusCode = 400;
            throw error;
        }
    }

    // Get current user
    const user = await userRepository.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    let hasUpdates = false;

    // Update name if provided
    if (name) {
        user.name = name.trim();
        hasUpdates = true;
    }

    // Handle image upload if provided
    if (file) {
        // Validate that file is an image
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
        if (!allowedImageTypes.includes(file.mimetype)) {
            const error = new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed for avatar');
            error.statusCode = 400;
            throw error;
        }

        try {
            // Upload to Cloudinary
            const cloudinaryResult = await uploadImageToCloudinary(
                file.buffer,
                file.originalname,
                file.mimetype,
                userId
            );
            
            user.avatarUrl = cloudinaryResult.secure_url;
            hasUpdates = true;
        } catch (error) {
            console.error('Error uploading image:', error);
            const uploadError = new Error('Failed to upload image to cloud storage');
            uploadError.statusCode = 500;
            throw uploadError;
        }
    }

    // Update password if provided (must use save() to trigger password hashing)
    if (newPassword) {
        user.password = newPassword;
        // Mark password as modified to trigger hashing
        user.markModified('password');
        hasUpdates = true;
    }

    // Check if there are any fields to update
    if (!hasUpdates) {
        const error = new Error('No fields provided to update');
        error.statusCode = 400;
        throw error;
    }

    // Save user (this will trigger password hashing if password was modified)
    const updatedUser = await user.save();
    
    if (!updatedUser) {
        const error = new Error('Failed to update user');
        error.statusCode = 500;
        throw error;
    }

    // Return user without password
    const userObj = updatedUser.toObject();
    delete userObj.password;
    
    return userObj;
};

/**
 * Get user profile
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - User object (without password)
 */
const getProfile = async (userId) => {
    const user = await userRepository.findById(userId);
    
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    
    return userObj;
};

/**
 * Request password reset - sends verification code to user's email
 * @param {String} email - User email address
 * @returns {Promise<Object>} - Success message
 */
const forgetPassword = async (email) => {
    // Find user by email
    const user = await userRepository.findByEmail(email);
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
        // Return success even if user doesn't exist to prevent email enumeration
        return { success: true, message: 'If the email exists, a password reset code has been sent.' };
    }

    // Create password reset token
    const emailToken = await createPasswordResetToken(user._id);

    // Send password reset email
    try {
        await emailService.sendPasswordResetCode(user.email, user.name, emailToken.token);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Delete the token if email fails
        await EmailToken.deleteOne({ _id: emailToken._id });
        const emailError = new Error('Failed to send password reset email');
        emailError.statusCode = 500;
        throw emailError;
    }

    // Return success message (don't reveal if user exists)
    return { success: true, message: 'If the email exists, a password reset code has been sent.' };
};

/**
 * Reset password using verification code
 * @param {String} code - Verification code
 * @param {String} newPassword - New password
 * @param {String} confirmPassword - Confirm password
 * @returns {Promise<Object>} - Success message
 */
const resetPassword = async (code, newPassword, confirmPassword) => {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        const error = new Error('Passwords do not match');
        error.statusCode = 400;
        throw error;
    }

    // Find the password reset token
    const emailToken = await EmailToken.findOne({
        token: code,
        type: 'password_reset'
    });

    if (!emailToken) {
        const error = new Error('Invalid or expired verification code');
        error.statusCode = 400;
        throw error;
    }

    // Check if token is expired
    if (new Date() > emailToken.expiresAt) {
        // Delete expired token
        await EmailToken.deleteOne({ _id: emailToken._id });
        const error = new Error('Verification code has expired. Please request a new one.');
        error.statusCode = 400;
        throw error;
    }

    // Get user
    const user = await userRepository.findById(emailToken.userId);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Update password (using save() to trigger password hashing)
    user.password = newPassword;
    user.markModified('password');
    await user.save();

    // Delete the used token
    await EmailToken.deleteOne({ _id: emailToken._id });

    return { success: true, message: 'Password has been reset successfully' };
};

module.exports = {
    register,
    login,
    verifyEmailToken,
    generateToken,
    generateAccessToken,
    updateProfile,
    getProfile,
    forgetPassword,
    resetPassword
};


