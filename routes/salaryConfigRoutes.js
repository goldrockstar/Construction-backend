const express = require('express');
const router = express.Router();
const salaryConfigController = require('../controller/salaryConfigController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), salaryConfigController.getAllSalaryConfigs);
router.get('/:id', auth, authorize('admin', 'manager'), salaryConfigController.getSalaryConfigById);
router.get('/project/:projectId', auth, authorize('admin', 'manager'), salaryConfigController.getSalaryConfigsByProjectId);
router.post('/', auth, authorize('admin'), salaryConfigController.createSalaryConfig);
router.put('/:id', auth, authorize('admin'), salaryConfigController.updateSalaryConfig);
router.delete('/:id', auth, authorize('admin'), salaryConfigController.deleteSalaryConfig);

module.exports = router;
