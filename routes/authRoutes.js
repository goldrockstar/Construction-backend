const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controller/authController')
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getMe);

module.exports = router;