const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByProject,
    getProjectTransactionsSummary
} = require('../controller/transaction');
const { authenticateToken, authorize } = require('../middleware/authMiddleware'); 

router.route('/')
    .get(authenticateToken, getTransactions)
    .post(authenticateToken, createTransaction);

router.route('/:id')
    .get(authenticateToken, getTransactionById)
    .put(authenticateToken, updateTransaction)
    .delete(authenticateToken, deleteTransaction);

// Route to get transactions for a specific project
router.get('/project/:projectId', authenticateToken, getTransactionsByProject);

router.get('/summary/:projectId', authenticateToken, authorize('admin', 'manager'), getProjectTransactionsSummary);

module.exports = router;