const nodemailer = require('nodemailer');
const { MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS, EMAIL_FROM, FRONTEND_URL } = require('../config/env');

// Check if Mailtrap credentials are configured
if (!MAILTRAP_USER || !MAILTRAP_PASS) {
    console.warn('⚠️  WARNING: Mailtrap credentials are not configured!');
    console.warn('Please add MAILTRAP_USER and MAILTRAP_PASS to your .env file');
    console.warn('Registration will work, but emails will not be sent.');
}

// Create transporter for Mailtrap
const transporter = nodemailer.createTransport({
    host: MAILTRAP_HOST,
    port: MAILTRAP_PORT,
    auth: {
        user: MAILTRAP_USER,
        pass: MAILTRAP_PASS
    }
});

/**
 * Send email verification token to user
 * @param {String} email - User email address
 * @param {String} name - User name
 * @param {String} token - Email confirmation token
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmailConfirmation = async (email, name, token) => {
    // Skip email sending if credentials are not configured
    if (!MAILTRAP_USER || !MAILTRAP_PASS) {
        console.warn(`⚠️  Email not sent to ${email} - Mailtrap credentials missing`);
        console.warn(`📧 Verification token: ${token}`);
        console.warn(`🔗 Verification URL: ${FRONTEND_URL}/verify-email?token=${token}`);
        return { success: false, message: 'Email credentials not configured' };
    }

    const confirmationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email Address - Smart Expense Tracker',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Smart Expense Tracker!</h2>
                <p>Hello ${name},</p>
                <p>Thank you for registering with Smart Expense Tracker. Please verify your email address by clicking the link below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationUrl}" 
                       style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${confirmationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you did not create an account, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Smart Expense Tracker Team</p>
            </div>
        `,
        text: `
            Welcome to Smart Expense Tracker!
            
            Hello ${name},
            
            Thank you for registering with Smart Expense Tracker. Please verify your email address by visiting:
            ${confirmationUrl}
            
            This link will expire in 24 hours.
            
            If you did not create an account, please ignore this email.
            
            Smart Expense Tracker Team
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        throw error;
    }
};

module.exports = {
    sendEmailConfirmation
};

