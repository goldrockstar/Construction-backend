const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole, getNextRoleId } = require('../controller/roleController'); // getNextRoleId சேர்க்கவும்
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

// Get Next Role ID (New Route) - இதை '/next-id' என்று வைக்கிறோம்
router.get('/next-id', authenticateToken, authorize('admin', 'manager'), getNextRoleId);

router.get('/', authenticateToken, authorize('admin', 'manager'), getRoles);
router.post('/', authenticateToken, authorize('admin'), createRole);
router.put('/:id', authenticateToken, authorize('admin'), updateRole);
router.delete('/:id', authenticateToken, authorize('admin'), deleteRole);

module.exports = router;