const express = require('express');
const router = express.Router();
const stockReportController = require('../controller/stockReportController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), stockReportController.getAllStockReports);

router.get('/:id', auth, authorize('admin', 'manager'), stockReportController.getStockReportById);

router.post('/', auth, authorize('admin'), stockReportController.createStockReport);

router.delete('/:id', auth, authorize('admin'), stockReportController.deleteStockReport);

router.get('/search', auth, authorize('admin', 'manager'), stockReportController.searchStockReport);

module.exports = router;