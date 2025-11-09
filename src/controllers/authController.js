const authService = require('../services/authService');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const result = await authService.register({
            name,
            email,
            password
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email to verify your account.',
            data: {
                user: {
                    id: result.user._id,
                    name: result.user.name,
                    email: result.user.email,
                    isEmailConfirmed: result.user.isEmailConfirmed
                },
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred during registration';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { error: error.stack })
        });
    }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await authService.verifyEmailToken(token);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    isEmailConfirmed: user.isEmailConfirmed
                }
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        
        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred during email verification';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { error: error.stack })
        });
    }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await authService.login(email, password);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: result.user._id,
                    name: result.user.name,
                    email: result.user.email,
                    isEmailConfirmed: result.user.isEmailConfirmed
                },
                accessToken: result.accessToken
            }
        });
    } catch (error) {
        
        const statusCode = error.statusCode || 500;
        const message = 'An error occurred during login';

       return res.status(statusCode).json({
            success: false,
            message,
        });
    }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        // Since JWT tokens are stateless, we just confirm logout
        // The client should discard the token on their end
        // In a production system with token blacklisting, you would invalidate the token here
        
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        
        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred during logout';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { error: error.stack })
        });
    }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.userId);

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    avatarUrl: user.avatarUrl || null,
                    isEmailConfirmed: user.isEmailConfirmed,
                    roles: user.roles,
                    settings: user.settings,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        
        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred while retrieving profile';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { error: error.stack })
        });
    }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
    try {
        const { name, newPassword, confirmPassword } = req.body;
        const file = req.file; // Multer file object
        
        const updatedUser = await authService.updateProfile(req.user.userId, {
            name,
            newPassword,
            confirmPassword,
            file
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    avatarUrl: updatedUser.avatarUrl,
                    isEmailConfirmed: updatedUser.isEmailConfirmed
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        const statusCode = error.statusCode || 500;
        const message = error.message || 'An error occurred while updating profile';

        res.status(statusCode).json({
            success: false,
            message,
            ...(process.env.NODE_ENV === 'development' && { error: error.stack })
        });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    logout,
    getProfile,
    updateProfile
};


