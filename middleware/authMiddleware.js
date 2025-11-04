const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Assuming you have a User model



// Middleware to protect routes (ensure user is authenticated and attach user to req)
const authenticateToken = asyncHandler(async (req, res, next) => {
    let token;

    // Check if the Authorization header is present and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by ID from the token payload and attach it to the request object
            // Exclude the password for security
            const user = await User.findById(decoded.id).select('-password');
            
            // If user is not found, throw an error
            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            req.user = user;
            next();

        } catch (error) {
            console.error(error); // Log the specific error for debugging
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    // If no token is found in the header
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

// An example authorization middleware, not essential but good practice
const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401);
            throw new Error('Not authorized, user not found');
        }
        if (req.user.role !== role) {
            res.status(403);
            throw new Error('Forbidden, insufficient permissions');
        }
        next();
    };
};

module.exports = { authenticateToken, authorize };
