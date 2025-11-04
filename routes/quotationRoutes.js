const express = require('express');
const router = express.Router();
const quotationController = require('../controller/quotationController');
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
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

const auth = authenticateToken;

router.get('/project-data/:projectId', auth, quotationController.getProjectMaterialsAndExpenditures);

router.get('/', auth, quotationController.getAllQuotations);

router.get('/:id', auth, quotationController.getQuotationById);

router.post('/', auth, upload.single('signature'), quotationController.createQuotation);

router.put('/:id', auth, upload.single('signature'), quotationController.updateQuotation);

router.delete('/:id', auth, quotationController.deleteQuotation);

module.exports = router;
