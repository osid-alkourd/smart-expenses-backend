const Tesseract = require('tesseract.js');

/**
 * Perform OCR on image buffer
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<String>} - Extracted text
 */
const extractTextFromImage = async (imageBuffer) => {
    try {
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',
            {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            }
        );
        
        return result.data.text;
    } catch (error) {
        console.error('OCR extraction error:', error);
        throw new Error('Failed to extract text from image');
    }
};

/**
 * Parse receipt data from OCR text
 * @param {String} ocrText - Raw OCR text
 * @returns {Object} - Parsed receipt data
 */
const parseReceiptData = (ocrText) => {
    const parsedData = {
        parsedMerchant: null,
        parsedAmount: null,
        parsedDate: null
    };

    // Extract amount (looking for patterns like $XX.XX, XX.XX, $XX)
    const amountPatterns = [
        /total[:\s]*\$?(\d+[.,]\d{2})/i,
        /amount[:\s]*\$?(\d+[.,]\d{2})/i,
        /\$(\d+[.,]\d{2})/g,
        /(\d+[.,]\d{2})/g
    ];

    for (const pattern of amountPatterns) {
        const match = ocrText.match(pattern);
        if (match) {
            const amount = match[1] || match[0];
            const cleanAmount = parseFloat(amount.replace(/[,$]/g, '').replace(',', '.'));
            if (cleanAmount > 0) {
                parsedData.parsedAmount = cleanAmount;
                break;
            }
        }
    }

    // Extract date (looking for various date formats)
    const datePatterns = [
        /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/,
        /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/,
        /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
        /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/i
    ];

    for (const pattern of datePatterns) {
        const match = ocrText.match(pattern);
        if (match) {
            const dateString = match[1];
            const parsedDate = new Date(dateString);
            if (!isNaN(parsedDate.getTime())) {
                parsedData.parsedDate = parsedDate;
                break;
            }
        }
    }

    // Extract merchant name (usually in the first few lines)
    const lines = ocrText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
        // Take the first non-empty line as merchant name
        parsedData.parsedMerchant = lines[0].trim();
        
        // If first line looks like an address or number, try second line
        if (/^\d+/.test(parsedData.parsedMerchant) || /street|avenue|road|blvd/i.test(parsedData.parsedMerchant)) {
            parsedData.parsedMerchant = lines[1]?.trim() || parsedData.parsedMerchant;
        }
    }

    return parsedData;
};

/**
 * Extract category from OCR text (basic categorization)
 * @param {String} ocrText - Raw OCR text
 * @returns {String|null} - Suggested category
 */
const extractCategory = (ocrText) => {
    const text = ocrText.toLowerCase();
    
     const categories = {
        'food': ['food', 'mcdonalds', 'starbucks', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'food', 'dining', 'kitchen'],
        'transport': [ 'transport','uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'metro', 'transit'],
        'shopping': ['shopping','store', 'market', 'shop', 'retail', 'mall'],
        'groceries': ['groceries','grocery', 'supermarket', 'walmart', 'target', 'safeway'],
        'entertainment': ['entertainment','cinema', 'movie', 'theater', 'game', 'entertainment'],
        'healthcare': ['healthcare','pharmacy', 'hospital', 'clinic', 'doctor', 'medical'],
        'utilities': ['utilities','electric', 'water', 'internet', 'phone', 'utility']
    };

    for (const [category, keywords] of Object.entries(categories)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }

    return null;
};

/**
 * Process receipt image with OCR and extract expense data
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Extracted data including text and parsed fields
 */
const processReceipt = async (imageBuffer) => {
    try {
        // Extract text using OCR
        const ocrText = await extractTextFromImage(imageBuffer);
        
        // Parse the text to extract structured data
        const parsedData = parseReceiptData(ocrText);
        
        // Extract category suggestion
        const category = extractCategory(ocrText);

        return {
            ocrText,
            parsedData,
            suggestedCategory: category
        };
    } catch (error) {
        console.error('Receipt processing error:', error);
        throw error;
    }
};

module.exports = {
    extractTextFromImage,
    parseReceiptData,
    extractCategory,
    processReceipt
};

