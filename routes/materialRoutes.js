const express = require('express');
const router = express.Router();
const { 
    getAllMaterials, 
    createMaterial, 
    updateMaterial, 
    deleteMaterial, 
    getMaterialById,
    getNextMaterialId // Import new controller
} = require('../controller/materialController'); // Path may vary based on your folder structure
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getAllMaterials);
router.post('/', authenticateToken, createMaterial);

// *** முக்கியம்: இதை ID route-க்கு மேலே வைக்கவும் ***
router.get('/next-id', authenticateToken, getNextMaterialId);

router.get('/:id', authenticateToken, getMaterialById);
router.put('/:id', authenticateToken, updateMaterial);
router.delete('/:id', authenticateToken, deleteMaterial);

module.exports = router;