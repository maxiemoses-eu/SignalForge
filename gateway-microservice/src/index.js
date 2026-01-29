const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- SECURITY AS CODE MEASURES ---

// 1. Helmet: Sets 15+ security headers (e.g., X-Content-Type-Options, Strict-Transport-Security)
app.use(helmet());

// 2. CORS: Explicitly define allowed origins in production for better security
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 3. Rate Limiting: Prevents DDoS/Brute-force by limiting requests per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

// 4. Health Check: Required for Jenkins/Docker health checks
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'StreamlinePay-Gateway' });
});

// --- PROXY ROUTES ---

const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Security: Add a custom header to identify traffic coming from the Gateway
        proxyReq.setHeader('X-Gateway-Auth', 'StreamlinePay-Internal');
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

app.use('/api/products', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-microservice:3002',
    pathRewrite: { '^/api/products': '' },
}));

app.use('/api/payments', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-microservice:3003',
    pathRewrite: { '^/api/payments': '' },
}));

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`[Secure Gateway]: StreamlinePay Gateway running on port ${PORT}`);
});const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- SECURITY AS CODE MEASURES ---

// 1. Helmet: Sets 15+ security headers (e.g., X-Content-Type-Options, Strict-Transport-Security)
app.use(helmet());

// 2. CORS: Explicitly define allowed origins in production for better security
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// 3. Rate Limiting: Prevents DDoS/Brute-force by limiting requests per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use(limiter);

// 4. Health Check: Required for Jenkins/Docker health checks
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'StreamlinePay-Gateway' });
});

// --- PROXY ROUTES ---

const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Security: Add a custom header to identify traffic coming from the Gateway
        proxyReq.setHeader('X-Gateway-Auth', 'StreamlinePay-Internal');
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

app.use('/api/products', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-microservice:3002',
    pathRewrite: { '^/api/products': '' },
}));

app.use('/api/payments', createProxyMiddleware({
    ...proxyOptions,
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-microservice:3003',
    pathRewrite: { '^/api/payments': '' },
}));

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`[Secure Gateway]: StreamlinePay Gateway running on port ${PORT}`);
});