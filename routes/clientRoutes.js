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

// Get All Clients
router.get('/', authenticateToken, getAllClients);

// Create Client
router.post('/', authenticateToken, upload.single('photo'), createClient);

// Get All Clients Info
router.get('/info', authenticateToken, getAllClients);

// --- கீழே உள்ள வரிகளில் மாற்றம் செய்யப்பட்டுள்ளது ---

// Get Single Client (clientId -> id)
router.get('/:id', authenticateToken, getClientById);

// Update Client (clientId -> id)
router.put('/:id', authenticateToken, upload.single('photo'), updateClient);

// Delete Client (clientId -> id)
router.delete('/:id', authenticateToken, deleteClient);

module.exports = router;