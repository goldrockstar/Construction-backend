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
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    getClientById
} = require('../controller/clientController');

router.get('/', authenticateToken, getAllClients);

router.post('/', authenticateToken, upload.single('photo'), createClient);
router.get('/info', authenticateToken, getAllClients);
router.get('/:clientId', authenticateToken, getClientById);
router.put('/:clientId', authenticateToken, upload.single('photo'), updateClient);
router.delete('/:clientId', authenticateToken, deleteClient);

module.exports = router;
