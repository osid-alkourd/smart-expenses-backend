const cloudinary = require('../config/cloudinary');
const receiptRepository = require('../repositories/receiptRepository');

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Original file name
 * @param {String} mimeType - File MIME type
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, fileName, mimeType, userId) => {
    return new Promise((resolve, reject) => {
        const resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
        
        const uploadOptions = {
            folder: `receipts/${userId}`,
            resource_type: resourceType,
            public_id: `receipt_${Date.now()}`
        };

        // Add image-specific transformations
        if (resourceType === 'image') {
            uploadOptions.transformation = [
                { width: 1500, height: 2000, crop: 'limit' },
                { quality: 'auto' }
            ];
        }

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
 * Create new receipt with file upload
 * @param {Object} file - Multer file object
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Created receipt document
 */
const createReceipt = async (file, userId) => {
    if (!file) {
        const error = new Error('No file provided');
        error.statusCode = 400;
        throw error;
    }

    // Validate file type
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'image/gif',
        'application/pdf'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error('Invalid file type. Only JPEG, PNG, WebP, GIF images and PDF files are allowed');
        error.statusCode = 400;
        throw error;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        const error = new Error('File size too large. Maximum size is 10MB');
        error.statusCode = 400;
        throw error;
    }

    try {
        // Upload to Cloudinary
        const cloudinaryResult = await uploadToCloudinary(
            file.buffer,
            file.originalname,
            file.mimetype,
            userId
        );

        // Create receipt record in database
        const receipt = await receiptRepository.create({
            userId,
            fileUrl: cloudinaryResult.secure_url,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            ocrStatus: 'pending'
        });

        return receipt;
    } catch (error) {
        console.error('Error uploading receipt:', error);
        
        if (error.statusCode) {
            throw error;
        }
        
        const uploadError = new Error('Failed to upload receipt to cloud storage');
        uploadError.statusCode = 500;
        throw uploadError;
    }
};

/**
 * Get receipt by ID
 * @param {String} receiptId - Receipt ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Receipt document
 */
const getReceiptById = async (receiptId, userId) => {
    const receipt = await receiptRepository.findById(receiptId);

    if (!receipt) {
        const error = new Error('Receipt not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if user owns the receipt
    if (receipt.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    return receipt;
};

/**
 * Get user receipts with pagination
 * @param {String} userId - User ID
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise<Object>} - Receipts and pagination info
 */
const getUserReceipts = async (userId, options = {}) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const receipts = await receiptRepository.findByUserId(userId, {
        limit: parseInt(limit),
        skip: parseInt(skip)
    });

    const total = await receiptRepository.countByUserId(userId);

    return {
        receipts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Delete receipt
 * @param {String} receiptId - Receipt ID
 * @param {String} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Deleted receipt document
 */
const deleteReceipt = async (receiptId, userId) => {
    const receipt = await receiptRepository.findById(receiptId);

    if (!receipt) {
        const error = new Error('Receipt not found');
        error.statusCode = 404;
        throw error;
    }

    // Check if user owns the receipt
    if (receipt.userId.toString() !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    // Extract public_id from Cloudinary URL to delete the file
    try {
        const urlParts = receipt.fileUrl.split('/');
        const publicIdWithExtension = urlParts.slice(-2).join('/');
        const publicId = publicIdWithExtension.split('.')[0];
        
        // Determine resource type
        const resourceType = receipt.mimeType === 'application/pdf' ? 'raw' : 'image';
        
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await receiptRepository.deleteById(receiptId);

    return receipt;
};

module.exports = {
    createReceipt,
    getReceiptById,
    getUserReceipts,
    deleteReceipt
};
