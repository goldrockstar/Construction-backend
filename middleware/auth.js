// backend/middleware/auth.js
const jwt = require('jsonwebtoken');



module.exports = function (req, res, next) {
    console.log('Auth middleware: Request received.');

    let token;
    const authHeader = req.header('Authorization');
    const xAuthTokenHeader = req.header('x-auth-token');

    console.log('Auth middleware: Authorization header:', authHeader);
    console.log('Auth middleware: x-auth-token header:', xAuthTokenHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (xAuthTokenHeader) {
        token = xAuthTokenHeader;
    }

    console.log('Auth middleware: Extracted token:', token);

    if (!token) {
        console.log('Auth middleware: No token found. Sending 401.');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        console.log('Auth middleware: Attempting to verify token...');
        // Use process.env.JWT_SECRET here
        const decoded = jwt.verify(token,process.env.JWT_SECRET); // <--- CHANGE IS HERE
        console.log('Auth middleware: Token successfully verified. Decoded user:', decoded.user);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth middleware: Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};