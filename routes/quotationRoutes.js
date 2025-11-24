const express = require('express');
const router = express.Router();
const quotationController = require('../controller/quotationController');
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming this middleware exists
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    // Recursive: true allows creating parent directories if they don't exist
    fs.mkdirSync(uploadsDir, { recursive: true }); 
}

// Multer storage configuration for handling file uploads (signature)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Use fieldname and a unique suffix to prevent file name collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

// Middleware alias for clarity
const auth = authenticateToken;

// --- Routes for Quotation Management ---

// 1. Get all quotations
router.get('/', auth, quotationController.getAllQuotations);

// 2. Get quotation by ID
router.get('/:id', auth, quotationController.getQuotationById);

// 3. Create a new quotation (handles signature upload and item data in body)
router.post('/', auth, upload.single('signature'), quotationController.createQuotation);

// 4. Update an existing quotation (handles signature update and item data in body)
router.put('/:id', auth, upload.single('signature'), quotationController.updateQuotation);

// 5. Delete a quotation
router.delete('/:id', auth, quotationController.deleteQuotation);

module.exports = router;