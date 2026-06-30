/**
 * errorHandler.js
 * ===============
 * Middleware centralizado de manejo de errores.
 */

const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    
    const statusCode = err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            code: err.code || 'UNKNOWN_ERROR',
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        }
    });
};

module.exports = errorHandler;
