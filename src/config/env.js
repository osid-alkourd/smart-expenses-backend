require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    // Mailtrap configuration
    MAILTRAP_HOST: process.env.MAILTRAP_HOST,
    MAILTRAP_PORT: process.env.MAILTRAP_PORT,
    MAILTRAP_USER: process.env.MAILTRAP_USER,
    MAILTRAP_PASS: process.env.MAILTRAP_PASS,
    // Email configuration
    EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@smartexpensetracker.com',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};

