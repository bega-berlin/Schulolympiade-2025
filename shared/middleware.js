/**
 * Middleware Module
 * Provides reusable middleware functions for Express applications
 */
const Logger = require('./logger');
const rateLimit = require('express-rate-limit');

/**
 * Create rate limiting middleware
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware function
 */
function createRateLimitMiddleware(options = {}) {
    const defaults = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    };
    
    return rateLimit({ ...defaults, ...options });
}

/**
 * Create strict rate limiting for sensitive endpoints
 * @returns {Function} Express middleware function
 */
function createStrictRateLimitMiddleware() {
    return createRateLimitMiddleware({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit to 5 requests per 15 minutes
        message: 'Too many attempts, please try again later.',
    });
}

/**
 * Create CORS middleware
 * @param {Array<string>} allowedOrigins - List of allowed origins
 * @returns {Function} Express middleware function
 */
function createCorsMiddleware(allowedOrigins) {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        
        next();
    };
}

/**
 * Create request logging middleware
 * @param {Logger} logger - Logger instance
 * @returns {Function} Express middleware function
 */
function createLoggingMiddleware(logger) {
    return async (req, res, next) => {
        await logger.logRequest(req);
        next();
    };
}

/**
 * Create error handling middleware
 * @param {Logger} logger - Logger instance
 * @returns {Function} Express error middleware function
 */
function createErrorMiddleware(logger) {
    return async (err, req, res, next) => {
        await logger.error('Unhandled error', err);
        res.status(500).json({ 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    };
}

/**
 * Create authentication middleware
 * @param {Set} validTokens - Set of valid authentication tokens
 * @returns {Function} Express middleware function
 */
function createAuthMiddleware(validTokens) {
    return (req, res, next) => {
        const token = req.headers.authorization;
        if (token && validTokens.has(token)) {
            next();
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Unauthorized - Invalid or missing token' 
            });
        }
    };
}

module.exports = {
    createCorsMiddleware,
    createLoggingMiddleware,
    createErrorMiddleware,
    createAuthMiddleware,
    createRateLimitMiddleware,
    createStrictRateLimitMiddleware
};
