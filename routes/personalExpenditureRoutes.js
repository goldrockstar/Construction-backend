const express = require('express');
const router = express.Router();
const personalExpenditureController = require('../controller/personalExpenditureController')
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const auth = authenticateToken;

router.get('/', auth, authorize('admin', 'manager'), personalExpenditureController.getAllPersonalExpenditures);

router.get('/:id', auth, authorize('admin', 'manager'), personalExpenditureController.getPersonalExpenditureById);

router.post('/', auth, authorize('admin', 'manager'), personalExpenditureController.createPersonalExpenditure);

router.put('/:id', auth, authorize('admin', 'manager'), personalExpenditureController.updatePersonalExpenditure);

router.delete('/:id', auth, authorize('admin', 'manager'), personalExpenditureController.deletePersonalExpenditure);

module.exports = router;
