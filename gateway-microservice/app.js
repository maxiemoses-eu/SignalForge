const express = require('express');
const helmet = require('helmet');

const app = express();

// 1. Security Middleware (Helmet)
// This automatically sets secure HTTP headers to prevent common attacks.
app.use(helmet());

// 2. Body Parsing Middleware
app.use(express.json());

/**
 * 3. Health Check Endpoint
 * This matches your security test suite. 
 * It provides a simple 200 OK to verify the service is "secure".
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'secure',
    timestamp: new Date().toISOString()
  });
});

// 4. API Routes (Example placeholders for SignalForge)
app.get('/', (req, res) => {
  res.send('SignalForge Gateway is Active');
});

/**
 * 5. Export the app
 * CRITICAL: We export the 'app' instance without calling 'app.listen()'.
 * This allows Supertest to start the app on a temporary port during testing
 * without clashing with your production port (8080).
 */
module.exports = app;