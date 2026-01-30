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

// --- CONFIG ---
const PORT = process.env.PORT || 9999;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

// --- 1. SECURITY AS CODE ---

// Secure HTTP headers (OWASP / Trivy friendly)
app.use(helmet());

// CORS (UI → Gateway)
app.use(cors({
  origin: ALLOWED_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Rate limiting ONLY for API traffic (not health checks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'SignalForge Security: Too many requests'
  }
});

app.use('/api', apiLimiter);

// --- 2. HEALTH CHECK (K8s / Jenkins / ArgoCD) ---

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'signalforge-gateway',
    timestamp: new Date().toISOString()
  });
});

// --- 3. PROXY BASE OPTIONS ---

const proxyOptions = {
  changeOrigin: true,
  xfwd: true,
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('X-SignalForge-Gateway', 'true');
  },
  onError: (err, req, res) => {
    console.error('[Gateway Error]', err.message);
    res.status(502).json({
      error: 'Service unavailable via SignalForge Gateway'
    });
  }
};

// --- 4. SERVICE ROUTES ---

// Orders Service
app.use('/api/orders', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.ORDER_SERVICE_URL || 'http://order-service:3001',
  pathRewrite: { '^/api/orders': '' }
}));

// Products Service
app.use('/api/products', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002',
  pathRewrite: { '^/api/products': '' }
}));

// Payments Service
app.use('/api/payments', createProxyMiddleware({
  ...proxyOptions,
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
  pathRewrite: { '^/api/payments': '' }
}));

// --- 5. SERVER START ---

app.listen(PORT, () => {
  console.log(`
🚀 SignalForge Gateway is running
--------------------------------
Port:   ${PORT}
Health: /health
APIs:   /api/*
--------------------------------
`);
});

// Export for tests
module.exports = app;
