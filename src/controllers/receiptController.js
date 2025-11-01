const receiptService = require('../services/receiptService');

/**
 * Upload receipt
 * POST /api/receipts
 */
const uploadReceipt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const file = req.file;

        const receipt = await receiptService.createReceipt(file, userId);

        res.status(201).json({
            success: true,
            message: 'Receipt uploaded successfully',
            data: {
                receipt: {
                    id: receipt._id,
                    fileUrl: receipt.fileUrl,
                    fileName: receipt.fileName,
                    fileSize: receipt.fileSize,
                    mimeType: receipt.mimeType,
                    ocrStatus: receipt.ocrStatus,
                    uploadedAt: receipt.uploadedAt
                }
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to upload receipt';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Get receipt by ID
 * GET /api/receipts/:id
 */
const getReceipt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const receiptId = req.params.id;

        const receipt = await receiptService.getReceiptById(receiptId, userId);

        res.status(200).json({
            success: true,
            data: {
                receipt
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to fetch receipt';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Get user receipts
 * GET /api/receipts
 */
const getUserReceipts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page, limit } = req.query;

        const result = await receiptService.getUserReceipts(userId, { page, limit });

        res.status(200).json({
            success: true,
            data: {
                receipts: result.receipts,
                pagination: result.pagination
            }
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to fetch receipts';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

/**
 * Delete receipt
 * DELETE /api/receipts/:id
 */
const deleteReceipt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const receiptId = req.params.id;

        await receiptService.deleteReceipt(receiptId, userId);

        res.status(200).json({
            success: true,
            message: 'Receipt deleted successfully'
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to delete receipt';

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

module.exports = {
    uploadReceipt,
    getReceipt,
    getUserReceipts,
    deleteReceipt
};
