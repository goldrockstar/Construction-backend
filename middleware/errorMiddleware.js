const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // If status code is 200, it's a server error
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV ===  'production' ? null : err.stack, // Show stack trace only in development
    });
};

module.exports = errorHandler;