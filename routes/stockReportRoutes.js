const express = require('express');
const router = express.Router();
const stockReportController = require('../controller/stockReportController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

// --- CRUD Operations ---
router.get('/', auth, authorize('admin', 'manager'), stockReportController.getAllStockReports);
router.get('/:id', auth, authorize('admin', 'manager'), stockReportController.getStockReportById);
router.post('/', auth, authorize('admin'), stockReportController.createStockReport);
router.delete('/:id', auth, authorize('admin'), stockReportController.deleteStockReport);

// --- Existing Stock Summary Report (Search/Filter) ---
router.get('/search', auth, authorize('admin', 'manager'), stockReportController.searchStockReport);

// --- NEW Material Reports ---

// 1. Detailed Stock In/Out Report (Detailed Transaction History)
router.get('/detailed-in-out', auth, authorize('admin', 'manager'), stockReportController.getDetailedStockInOutReport);

// 2. Material Consumption by Project (Total quantity used per material for a project/period)
router.get('/consumption', auth, authorize('admin', 'manager'), stockReportController.getMaterialConsumptionByProject);

// 3. Low Stock & Reorder Report (Global inventory check against reorder level)
router.get('/low-stock', auth, authorize('admin', 'manager'), stockReportController.getLowStockReorderReport);

module.exports = router;