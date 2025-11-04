const express = require('express');
const {getRoles, createRole, updateRole, deleteRole} = require('../controller/roleController');
const {authenticateToken, authorize} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, authorize('admin', 'manager'), getRoles);
router.post('/', authenticateToken, authorize('admin'), createRole);
router.put('/:id', authenticateToken, authorize('admin'), updateRole);
router.delete('/:id', authenticateToken, authorize('admin'), deleteRole);

module.exports = router;