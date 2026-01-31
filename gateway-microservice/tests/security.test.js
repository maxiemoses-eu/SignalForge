const request = require('supertest');
const app = require('../app'); // Adjust this path if your express app is in server.js or index.js

/**
 * SignalForge Gateway Security Suite
 * These tests ensure that the Helmet middleware is correctly 
 * configuring security headers to prevent XSS and Clickjacking.
 */
describe('Gateway Security & Header Integrity', () => {

  // 1. Helmet Security Headers Check
  test('Security headers should be present (Helmet)', async () => {
    const response = await request(app).get('/health');
    
    // Check for specific headers set by Helmet
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toBeDefined();
    
    // Ensure Express fingerprinting is disabled
    expect(response.headers['x-powered-by']).toBeUndefined();
  }, 10000); // 10s timeout to allow for CI environment latency

  // 2. Health Check Availability
  test('Health endpoint should be accessible', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('secure');
  });

});