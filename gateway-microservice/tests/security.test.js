const request = require('supertest');
const app = require('../app'); // This imports the express instance from app.js

describe('Gateway Security Tests', () => {
  
  test('Security headers should be present (Helmet)', async () => {
    const response = await request(app).get('/health');
    
    // Check for Helmet-specific security headers
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toBeDefined();
    
    // Ensure Express fingerprinting is disabled
    expect(response.headers['x-powered-by']).toBeUndefined();
  }, 10000); // 10s timeout for CI environment stability

  test('Health check should return secure status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('secure');
  });

});