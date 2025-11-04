const express = require('express');
const materialController = require('../controller/materialController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, authorize('admin', 'manager'), materialController.getAllMaterials);

router.get('/:id', authenticateToken, authorize('admin', 'manager'), materialController.getMaterialById);

router.post('/', authenticateToken, authorize('admin'), materialController.createMaterial);

router.put('/:id', authenticateToken, authorize('admin'), materialController.updateMaterial);

router.delete('/:id', authenticateToken, authorize('admin'), materialController.deleteMaterial);

module.exports = router;