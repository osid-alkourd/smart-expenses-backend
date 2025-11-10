const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, emailConfirmValidation, updateProfileValidation, forgetPasswordValidation, resetPasswordValidation, handleValidationErrors } = require('../validations/authValidation');
const { auth, requireGuest } = require('../middleware/auth');
const upload = require('../utils/upload');

// Multer for handling multipart/form-data (without files)
const uploadNone = multer();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', uploadNone.none(), registerValidation, handleValidationErrors, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, handleValidationErrors, authController.login);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', uploadNone.none(), emailConfirmValidation, handleValidationErrors, authController.verifyEmail);

/**
 * @route   POST /api/auth/forget-password
 * @desc    Request password reset - sends verification code to email
 * @access  Public (unauthenticated users only)
 */
router.post('/forget-password', requireGuest, uploadNone.none(), forgetPasswordValidation, handleValidationErrors, authController.forgetPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using verification code
 * @access  Public (unauthenticated users only)
 */
router.post('/reset-password', requireGuest, uploadNone.none(), resetPasswordValidation, handleValidationErrors, authController.resetPassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (requires authentication)
 */
router.post('/logout', auth, authController.logout);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private (requires authentication)
 */
router.get('/profile', auth, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name, password, avatar image)
 * @access  Private (requires authentication)
 */
router.put('/profile', auth, upload.single('image'), updateProfileValidation, handleValidationErrors, authController.updateProfile);

module.exports = router;


