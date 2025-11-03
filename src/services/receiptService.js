const cloudinary = require('../config/cloudinary');
const receiptRepository = require('../repositories/receiptRepository');
const expenseRepository = require('../repositories/expenseRepository');
const ocrService = require('./ocrService');

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

        // Process OCR in the background (don't wait for it)
        processReceiptOCR(receipt._id, file.buffer, userId).catch(error => {
            console.error('Background OCR processing error:', error);
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
 * Process receipt OCR and create expense (background task)
 * @param {String} receiptId - Receipt ID
 * @param {Buffer} imageBuffer - Image buffer
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Created expense or error
 */
const processReceiptOCR = async (receiptId, imageBuffer, userId) => {
    try {
        // Update receipt status to processing
        await receiptRepository.update(receiptId, { ocrStatus: 'processing' });

        // Process OCR only for images (not PDFs)
        const receipt = await receiptRepository.findById(receiptId);
        const isImage = receipt.mimeType.startsWith('image/');
        
        if (!isImage) {
            await receiptRepository.update(receiptId, { 
                ocrStatus: 'done',
                ocrResult: 'PDF files do not support OCR processing' 
            });
            return null;
        }

        // Extract data from receipt
        const { ocrText, parsedData, suggestedCategory } = await ocrService.processReceipt(imageBuffer);

        // Update receipt with OCR results
        await receiptRepository.update(receiptId, { 
            ocrStatus: 'done',
            ocrResult: ocrText 
        });

        // Create expense if we have amount and date
        const amount = parsedData.parsedAmount;
        const date = parsedData.parsedDate || new Date();
        
        if (amount && amount > 0) {
            const expense = await expenseRepository.create({
                userId,
                receiptId,
                merchant: parsedData.parsedMerchant || 'Unknown Merchant',
                amount,
                date,
                category: suggestedCategory,
                ocrText,
                parsedData: {
                    parsedMerchant: parsedData.parsedMerchant,
                    parsedDate: parsedData.parsedDate,
                    parsedAmount: parsedData.parsedAmount
                },
                isVerified: false
            });

            console.log(`✅ Expense created automatically for receipt ${receiptId}`);
            return expense;
        } else {
            console.log(`⚠️  Could not extract amount from receipt ${receiptId}. Manual entry required.`);
            return null;
        }
    } catch (error) {
        console.error('OCR processing failed:', error);
        await receiptRepository.update(receiptId, { ocrStatus: 'failed' });
        return null;
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
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
        // or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
        const url = receipt.fileUrl;
        
        // Find the position of 'upload/' and extract everything after it
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) {
            throw new Error('Invalid Cloudinary URL format');
        }
        
        // Get the part after '/upload/'
        const afterUpload = url.substring(uploadIndex + 8); // 8 = length of '/upload/'
        
        // Remove version if present (starts with v followed by numbers)
        let pathWithExtension = afterUpload;
        if (/^v\d+\//.test(afterUpload)) {
            // Remove version part (e.g., 'v1234567890/')
            pathWithExtension = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        
        // Remove file extension
        const publicId = pathWithExtension.substring(0, pathWithExtension.lastIndexOf('.'));
        
        // Determine resource type
        const resourceType = receipt.mimeType === 'application/pdf' ? 'raw' : 'image';
        
        console.log(`Deleting from Cloudinary: ${publicId} (${resourceType})`);
        
        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        
        if (result.result === 'ok') {
            console.log('✅ Successfully deleted from Cloudinary');
        } else {
            console.warn('⚠️  Cloudinary deletion result:', result);
        }
    } catch (error) {
        console.error('❌ Error deleting from Cloudinary:', error);
        // Continue with database deletion even if Cloudinary deletion fails
    }

    // Check if there's an associated expense and delete it
    try {
        const expense = await expenseRepository.findByReceiptId(receiptId);
        if (expense) {
            await expenseRepository.deleteById(expense._id);
            console.log(`✅ Associated expense deleted: ${expense._id}`);
        }
    } catch (error) {
        console.error('Error deleting associated expense:', error);
        // Continue with receipt deletion
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
