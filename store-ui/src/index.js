/**
 * SignalForge Secure API Gateway
 * Project: Security-as-Code
 * Port: 9999 (Avoids Jenkins 8080 and ArgoCD 9000)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

// Set port to 9999 to avoid conflicts with DevOps tools
const PORT = process.env.PORT || 9999;

// --- 1. SECURITY AS CODE MIDDLEWARE ---

// Helmet sets secure HTTP headers to pass Trivy/OWASP checks
app.use(helmet());

// CORS configuration - Allow your store-ui to communicate
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Rate Limiting to prevent brute-force and DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "SignalForge Security: Too many requests from this IP."
});
app.use(limiter);

// --- 2. HEALTH CHECK (For Jenkins & Kubernetes) ---

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        project: 'SignalForge',
        timestamp: new Date().toISOString()
    });
});

// --- 3. PROXY CONFIGURATION (Routing Logic) ---

// Common options for all microservices
const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Tag requests so microservices know they came through the secure gateway
        proxyReq.setHeader('X-SignalForge-Gateway', 'true');
    },
    onError: (err, req, res) => {
        console.error('[Gateway Error]:', err.message);
        res.status(502).json({ error: 'Service temporarily unavailable through SignalForge Gateway' });
    }
};

// Route: Orders
app.use('/api/orders', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.ORDER_SERVICE_URL || 'http://order-microservice:3001',
    pathRewrite: { '^/api/orders': '' }, 
}));

// Route: Products
app.use('/api/products', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-microservice:3002',
    pathRewrite: { '^/api/products': '' },
}));

// Route: Payments
app.use('/api/payments', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-microservice:3003',
    pathRewrite: { '^/api/payments': '' },
}));

// --- 4. SERVER START ---

app.listen(PORT, () => {
    console.log(`
    🚀 SignalForge Secure Gateway Active
    -----------------------------------
    Port:    ${PORT}
    Status:  Ready for Jenkins/Trivy Scan
    -----------------------------------
    `);
});

// Export for Security Unit Tests
module.exports = app;