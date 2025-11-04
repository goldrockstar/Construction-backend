const express = require('express');
const userController = require('../controller/userController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authenticateToken, userController.getOwnProfile);

router.get('/:id', authenticateToken, userController.getUserById);

router.get('/', authenticateToken, authorize(['admin']), userController.getUsers);

router.put('/profile', authenticateToken, userController.updateProfile); 

router.put('/password', authenticateToken, userController.updatePassword);

router.put('/:id/role', authenticateToken, authorize(['admin']), userController.updateUserRole);

router.delete('/:id', authenticateToken, authorize(['admin']), userController.deleteUser);

module.exports = router;
