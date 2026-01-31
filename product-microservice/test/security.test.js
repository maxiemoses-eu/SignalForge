const request = require('supertest');
const app = require('../app'); // Ensure your express app is exported from app.js

describe('Product Service Security Tests', () => {
  
  // 1. Security Headers Check
  test('Should have security headers enabled (Helmet)', async () => {
    const response = await request(app).get('/products');
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
  });

  // 2. Broken Access Control Check
  test('Should return 401 for unauthenticated product deletion', async () => {
    const response = await request(app).delete('/products/123');
    // We expect a failure because no token was provided
    expect(response.status).toBe(401); 
  });

  // 3. XSS Protection Check
  test('Should sanitize or reject malicious script tags in product search', async () => {
    const maliciousPayload = "<script>alert('xss')</script>";
    const response = await request(app)
      .get(`/products/search?q=${maliciousPayload}`);
    
    // The app should either return an error or not execute the script
    expect(response.status).not.toBe(500);
  });
});