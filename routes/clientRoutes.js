const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware');
const path = require('path');

const UPLOAD_FOLDER = 'uploads';
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', UPLOAD_FOLDER));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

const {
    createProjectClient,
    getProjectClientInfo,
    updateProjectClient,
    deleteProjectClient,
    getAllClients
} = require('../controller/clientController');

router.get('/', authenticateToken, getAllClients);

router.post('/', authenticateToken, upload.single('photo'), createProjectClient);
router.get('/info', authenticateToken, getProjectClientInfo);
router.put('/:clientId', authenticateToken, upload.single('photo'), updateProjectClient);
router.delete('/:clientId', authenticateToken, deleteProjectClient);

module.exports = router;
