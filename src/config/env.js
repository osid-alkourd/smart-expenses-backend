const path = require("path");
const fs = require("fs");
const dotenvPath = path.resolve(__dirname, "../../.env");

console.log("🧭 process.cwd():", process.cwd());
console.log("📂 __dirname:", __dirname);
console.log("📄 Expecting .env at:", dotenvPath);
console.log("📁 File exists:", fs.existsSync(dotenvPath));

const result = require("dotenv").config({ path: dotenvPath });
console.log("🧾 dotenv result:", result);

console.log("📦 MONGODB_URI =", process.env.MONGODB_URI);
console.log("📦 MAILTRAP_USER =", process.env.MAILTRAP_USER);



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
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    // Cloudinary configuration
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
};

