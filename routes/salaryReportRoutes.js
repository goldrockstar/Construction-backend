const express = require('express');
const { 
    getMonthlyFinancialSummary, 
    getTopProfitProjects, 
    getSalaryReport,
    getManpowerUtilizationReport 
} = require('../controller/salaryReportController'); // Check this path carefully!
const { authorize } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

const router = express.Router();

// All reports typically require authentication and proper role authorization
router.get('/financial-summary',authorize('admin', 'manager'), getMonthlyFinancialSummary);
router.get('/top-profit-projects',authorize('admin', 'manager'), getTopProfitProjects);
router.get('/salary-report',authorize('admin', 'manager'), getSalaryReport);
router.post('/manpower-utilization',authorize('admin', 'manager'), getManpowerUtilizationReport);

module.exports = router;