const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { username, password, email, role, profile } = req.body; 

    if (!username || !password) {
        res.status(400);
        throw new Error('Please enter username and password');
    }

    const userExistsByUsername = await User.findOne({ username });
    if (userExistsByUsername) {
        res.status(400);
        throw new Error('Username already exists');
    }

    if (email) { // Only check email if it's provided
        const userExistsByEmail = await User.findOne({ email });
        if (userExistsByEmail) {
            res.status(400);
            throw new Error('Email already registered');
        }
    }

    const user = await User.create({
        username,
        password, 
        email, 
        role: role || 'employee', // Default to 'employee'
        profile: profile || {} // Store profile data
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please enter username and password');
    }

    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            token: generateToken(user._id),
        });
    } else {        
        res.status(401);
        throw new Error('Invalid username or password');
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user); // req.user is set by authentication middleware
});

module.exports = {
    registerUser,
    loginUser,
    getMe,
};