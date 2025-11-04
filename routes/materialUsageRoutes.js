// C:\Users\karup\OneDrive\Documents\EshwarConstruction\backend\routes\materialUsageRoutes.js
const express = require('express');
const router = express.Router();
const materialUsageController = require('../controller/materialUsageController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), materialUsageController.getAllMaterialUsages);

router.get('/:id', auth, authorize('admin', 'manager'), materialUsageController.getMaterialUsageById);

router.get('/project/:projectId', auth, authorize('admin', 'manager'), materialUsageController.getMaterialUsagesByProjectId);

router.post('/', auth, authorize('admin'), materialUsageController.createMaterialUsage);

router.put('/:id', auth, authorize('admin'), materialUsageController.updateMaterialUsage);

router.delete('/:id', auth, authorize('admin'), materialUsageController.deleteMaterialUsage);

module.exports = router;
