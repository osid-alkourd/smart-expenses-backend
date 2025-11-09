const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, emailConfirmValidation, updateProfileValidation, handleValidationErrors } = require('../validations/authValidation');
const { auth } = require('../middleware/auth');
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


