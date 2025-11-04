const express = require('express');
const router = express.Router();
const manpowerController = require('../controller/manpowerController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploads';
const UPLOADS_PATH = path.join(__dirname, '..', UPLOAD_FOLDER);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(UPLOADS_PATH)) {
            fs.mkdirSync(UPLOADS_PATH);
        }
        cb(null, UPLOADS_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

router.get('/', authenticateToken, authorize('admin', 'manager'), manpowerController.getManpower);
router.get('/:id', authenticateToken, authorize('admin', 'manager'), manpowerController.getManpowerById);
router.post('/', authenticateToken, authorize('admin'), upload.single('photo'), manpowerController.createManpower);
router.put('/:id', authenticateToken, authorize('admin'), upload.single('photo'), manpowerController.updateManpower);
router.delete('/:id', authenticateToken, authorize('admin'), manpowerController.deleteManpower);

module.exports = router;
