const express = require('express');
const router = express.Router();
const projectExpenditureController = require('../controller/projectExpenditureController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), projectExpenditureController.getAllProjectExpenditures);

router.get('/:id', auth, authorize('admin', 'manager'), projectExpenditureController.getProjectExpenditureById);

router.get('/project/:projectId', auth, authorize('admin', 'manager'), projectExpenditureController.getProjectExpendituresByProjectId);

router.post('/', auth, authorize('admin'), projectExpenditureController.createProjectExpenditure);

router.put('/:id', auth, authorize('admin'), projectExpenditureController.updateProjectExpenditure);

router.delete('/:id', auth, authorize('admin'), projectExpenditureController.deleteProjectExpenditure);

module.exports = router;
