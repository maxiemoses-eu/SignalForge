const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- SECURITY AS CODE MEASURES ---
app.use(helmet()); // Sets security headers

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'SignalForge-Gateway' });
});

// --- PROXY ROUTES ---
const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Gateway-Auth', 'SignalForge-Internal');
    },
    onError: (err, req, res) => {
        console.error('[Gateway Error]:', err.message);
        res.status(502).send('Gateway Error: Service Unreachable');
    }
};

app.use('/api/orders', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.ORDER_SERVICE_URL || 'http://order-microservice:3001',
    pathRewrite: { '^/api/orders': '' },
}));

// --- START SERVER ---
// Only listen if not in test mode to avoid "Address already in use" errors
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`[Secure Gateway]: SignalForge Gateway running on port ${PORT}`);
    });
}

module.exports = app; // Export for Jest tests