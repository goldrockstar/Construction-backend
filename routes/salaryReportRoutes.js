const express = require('express');
const router = express.Router();
const salaryReportController = require('../controller/salaryReportController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), salaryReportController.getAllSalaryReports);

router.get('/:id', auth, authorize('admin', 'manager'), salaryReportController.getSalaryReportById);

router.post('/', auth, authorize('admin'), salaryReportController.createSalaryReport);

router.delete('/:id', auth, authorize('admin'), salaryReportController.deleteSalaryReport);

module.exports = router;
