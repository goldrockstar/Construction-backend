const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware');
const path = require('path');

// Multer Setup
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

// Controller Imports
const {
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    getClientById,
    getNextClientId 
} = require('../controller/clientController');

// --- ROUTES ---

// 1. Get All Clients
router.get('/', authenticateToken, getAllClients);

// 2. Create Client
router.post('/', authenticateToken, upload.single('photo'), createClient);

// 3. Get Next Client ID (STATIC route - Must be BEFORE dynamic :id)
router.get('/next-id', authenticateToken, getNextClientId);

// 4. Get Client Info (STATIC route)
router.get('/info', authenticateToken, getAllClients);

// 5. Dynamic Routes (Using :id) - Must be LAST
router.get('/:id', authenticateToken, getClientById);
router.put('/:id', authenticateToken, upload.single('photo'), updateClient);
router.delete('/:id', authenticateToken, deleteClient);

module.exports = router;