const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Security Middleware
app.use(helmet()); 
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || '*' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'SignalForge-Gateway' });
});

// Proxy logic here...

// Start Server conditionally for Testing compatibility
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`[Secure Gateway]: Running on port ${PORT}`));
}

module.exports = app;