const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { auth } = require('../middleware/auth');
const upload = require('../utils/upload');
const { getReceiptValidation, paginationValidation, handleValidationErrors } = require('../validations/receiptValidation');

/**
 * @route   POST /api/receipts
 * @desc    Upload receipt image or file
 * @access  Private
 */
router.post('/', auth, upload.single('receipt'), receiptController.uploadReceipt);

/**
 * @route   GET /api/receipts
 * @desc    Get user receipts with pagination
 * @access  Private
 */
router.get('/', auth, paginationValidation, handleValidationErrors, receiptController.getUserReceipts);

/**
 * @route   GET /api/receipts/:id
 * @desc    Get receipt by ID
 * @access  Private
 */
router.get('/:id', auth, getReceiptValidation, handleValidationErrors, receiptController.getReceipt);

/**
 * @route   DELETE /api/receipts/:id
 * @desc    Delete receipt
 * @access  Private
 */
router.delete('/:id', auth, getReceiptValidation, handleValidationErrors, receiptController.deleteReceipt);

module.exports = router;
