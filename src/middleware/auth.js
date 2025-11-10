const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const userRepository = require('../repositories/userRepository');

/**
 * Authentication middleware - Verifies JWT token
 * Extracts token from Authorization header: "Bearer <token>"
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Check if token starts with "Bearer "
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Use: Bearer <token>'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove "Bearer " prefix

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const user = await userRepository.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }

        // Attach user to request object
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            roles: user.roles,
            isEmailConfirmed: user.isEmailConfirmed
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Authentication failed.'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userRepository.findById(decoded.userId);

        if (user) {
            req.user = {
                userId: user._id.toString(),
                email: user.email,
                name: user.name,
                roles: user.roles,
                isEmailConfirmed: user.isEmailConfirmed
            };
        }

        next();
    } catch (error) {
        // Don't fail on error, just continue without user
        next();
    }
};

/**
 * Check if user's email is verified
 */
const requireEmailVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });
    }

    if (!req.user.isEmailConfirmed) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email address to access this resource.'
        });
    }

    next();
};

/**
 * Check if user has required role
 * @param {Array|String} roles - Required role(s)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const hasRole = roles.some(role => req.user.roles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Require guest (unauthenticated) - prevents authenticated users from accessing
 * Used for routes like forget-password and reset-password
 */
const requireGuest = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        // If no authorization header, user is not authenticated - allow access
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            return next();
        }

        // Try to verify the token
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await userRepository.findById(decoded.userId);

            // If user is found and token is valid, they are authenticated - deny access
            if (user) {
                return res.status(403).json({
                    success: false,
                    message: 'This action is not available for authenticated users. Please logout first.'
                });
            }
        } catch (error) {
            // If token is invalid or expired, user is not authenticated - allow access
            return next();
        }

        // If we get here, user is not authenticated - allow access
        next();
    } catch (error) {
        // On any error, allow access (fail open for guest routes)
        next();
    }
};

module.exports = {
    auth,
    optionalAuth,
    requireEmailVerified,
    requireRole,
    requireGuest
};
