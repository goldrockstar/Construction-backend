const express = require('express');
const router = express.Router();
const receiptController = require('../controller/receiptController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), receiptController.getAllReceipts);

router.get('/:id', auth, authorize('admin', 'manager'), receiptController.getReceiptById);

router.post('/', auth, authorize('admin'), receiptController.createReceipt);

router.put('/:id', auth, authorize('admin'), receiptController.updateReceipt);

router.delete('/:id', auth, authorize('admin'), receiptController.deleteReceipt);

module.exports = router;
