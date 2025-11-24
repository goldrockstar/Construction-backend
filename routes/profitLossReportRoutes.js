const express = require('express');
const router = express.Router();
const profitLossReportController = require('../controller/profitLossReportController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

// Route to get all P&L Reports (Accessible to Admin and Manager)
router.get('/', auth, authorize('admin', 'manager'), profitLossReportController.getAllProfitLossReports);

// Route to create a new P&L Report (Only accessible to Admin)
router.post('/', auth, authorize('admin'), profitLossReportController.createProfitLossReport);

// Route to get a specific P&L Report by ID (Accessible to Admin and Manager)
router.get('/:id', auth, authorize('admin', 'manager'), profitLossReportController.getProfitLossReportById);

// Route to delete a P&L Report (Only accessible to Admin)
router.delete('/:id', auth, authorize('admin'), profitLossReportController.deleteProfitLossReport);

module.exports = router;