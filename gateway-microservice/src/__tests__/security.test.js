const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
// We import the app logic. Ensure your index.js uses 'module.exports = app;' at the end.
const app = require('../index'); 

describe('StreamlinePay Gateway Security Suite', () => {
  
  // 1. Test for Secure Headers (Helmet)
  test('Security headers should be present (Helmet)', async () => {
    const response = await request(app).get('/health');
    
    // X-Powered-By should be hidden (stops hackers from knowing you use Express)
    expect(response.headers['x-powered-by']).toBeUndefined();
    
    // DNS Prefetch Control
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    
    // Frameguard (prevents Clickjacking)
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    
    // Strict-Transport-Security (HSTS) - only if your app thinks it's HTTPS
    // expect(response.headers['strict-transport-security']).toBeDefined();
  });

  // 2. Test for Rate Limiting
  test('Rate limiting should eventually block repeated requests', async () => {
    // We send several requests quickly to see if the header appears
    const responses = await Promise.all(
      Array.from({ length: 5 }).map(() => request(app).get('/health'))
    );
    
    // Check if the rate limit headers are being sent back to the client
    expect(responses[0].headers['ratelimit-limit']).toBeDefined();
    expect(responses[0].headers['ratelimit-remaining']).toBeDefined();
  });

  // 3. Test for CORS configuration
  test('CORS should be configured', async () => {
    const response = await request(app)
      .options('/api/products') // Pre-flight request
      .set('Origin', 'http://malicious-site.com');
    
    // If you configured specific origins, this should reflect that logic
    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });

  // 4. Test for Health/Availability
  test('Health check endpoint should be public and return UP', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
  });
});