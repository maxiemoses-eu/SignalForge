const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- SIGNALFORGE SECURITY AS CODE ---

// 1. Helmet: Essential for passing security scans
app.use(helmet());

// 2. Rate Limiting: Hardened protection
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests. SignalForge security triggered."
});
app.use(limiter);

// 3. Health Check: For Jenkins and K8s Liveness Probes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', project: 'SignalForge' });
});

// --- PROXY CONFIGURATION ---

const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-SignalForge-Verified', 'true');
    },
    onError: (err, req, res) => {
        res.status(502).json({ error: 'SignalForge Gateway: Service Unreachable' });
    }
};

app.use('/api/orders', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.ORDER_SERVICE_URL || 'http://order-service:3001',
    pathRewrite: { '^/api/orders': '' },
}));

app.use('/api/products', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
    pathRewrite: { '^/api/products': '' },
}));

app.listen(PORT, () => console.log(`SignalForge Secure Gateway on port ${PORT}`));

module.exports = app; // Required for security tests