const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, emailConfirmValidation, handleValidationErrors } = require('../validations/authValidation');
const { auth } = require('../middleware/auth');

// Multer for handling multipart/form-data (without files)
const upload = multer();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', upload.none(), registerValidation, handleValidationErrors, authController.register);

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
router.post('/verify-email', upload.none(), emailConfirmValidation, handleValidationErrors, authController.verifyEmail);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private (requires authentication)
 */
router.post('/logout', auth, authController.logout);

module.exports = router;


