const express = require('express');
const router = express.Router();
const invoiceController = require('../controller/invoiceController');
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.filename}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

const auth = authenticateToken;


router.get('/', auth, invoiceController.getAllInvoices);

router.get('/:id', auth, invoiceController.getInvoiceById);

router.get('/project-data/:projectId', auth, invoiceController.getProjectMaterialsAndExpenditures);

router.post('/', auth, upload.single('signature'), invoiceController.createInvoice);

router.put('/:id', auth, upload.single('signature'), invoiceController.updateInvoice);

router.delete('/:id', auth, invoiceController.deleteInvoice);

module.exports = router;
