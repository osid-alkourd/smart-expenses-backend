const express = require('express');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!', database: 'MongoDB connected' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Visit http://localhost:${PORT}`);
});
