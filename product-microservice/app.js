const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'secure', service: 'product' });
});

// CRITICAL: Export for Jest/Supertest
module.exports = app;