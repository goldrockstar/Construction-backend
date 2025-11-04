const express = require('express');
const router = express.Router();
const profitLossReportController = require('../controller/profitLossReportController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), profitLossReportController.getAllProfitLossReports);

router.post('/', auth, authorize('admin'), profitLossReportController.createProfitLossReport);

router.get('/:id', auth, authorize('admin', 'manager'), profitLossReportController.getProfitLossReportById);

router.delete('/:id', auth, authorize('admin'), profitLossReportController.deleteProfitLossReport);

module.exports = router;

