const express = require('express');
const router = express.Router();
// Changed to import the correct controller logic
const invoiceController = require('../controller/invoiceController'); 
const { authenticateToken } = require('../middleware/authMiddleware'); // Assuming this middleware exists
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists (This logic is often handled in the controller setup, 
// but is kept here to ensure file system access works if needed)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    // Recursive: true allows creating parent directories if they don't exist
    fs.mkdirSync(uploadsDir, { recursive: true }); 
}

// Multer storage configuration for handling file uploads (signature)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Destination directory is relative to the project root, hence just 'uploads/'
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

// --- Routes for Invoice Management ---

// 1. Get all Invoices
router.get('/', auth, invoiceController.getAllInvoices);

// 2. Get Invoice by ID (Crucial for Edit form pre-population)
router.get('/:id', auth, invoiceController.getInvoiceById);

// 3. Create a new Invoice (handles signature file upload and form data)
router.post('/', auth, upload.single('signature'), invoiceController.createInvoice);

// 4. Update an existing Invoice (handles signature file update and form data)
router.put('/:id', auth, upload.single('signature'), invoiceController.updateInvoice);

// 5. Delete an Invoice
router.delete('/:id', auth, invoiceController.deleteInvoice);

module.exports = router;