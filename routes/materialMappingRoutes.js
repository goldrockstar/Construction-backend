const express = require('express');
const router = express.Router();
const materialMappingController = require('../controller/materialMappingController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const auth = authenticateToken;

router.get('/project/:projectId', auth, authorize('admin', 'manager'), materialMappingController.getMaterialMappingsByProjectId);

router.get('/:id', auth, authorize('admin', 'manager'), materialMappingController.getMaterialMappingById);

router.get('/', auth, authorize('admin', 'manager'), materialMappingController.getMaterialMappings);

router.post('/', auth, authorize('admin', 'manager'), materialMappingController.createMaterialMapping);

router.put('/:id', auth, authorize('admin', 'manager'), materialMappingController.updateMaterialMapping);

router.delete('/:id', auth, authorize('admin', 'manager'), materialMappingController.deleteMaterialMapping);

module.exports = router;
