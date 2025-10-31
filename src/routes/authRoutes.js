const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/authController');
const { registerValidation, emailConfirmValidation, handleValidationErrors } = require('../validations/authValidation');

// Multer for handling multipart/form-data (without files)
const upload = multer();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', upload.none(), registerValidation, handleValidationErrors, authController.register);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', upload.none(), emailConfirmValidation, handleValidationErrors, authController.verifyEmail);

module.exports = router;


