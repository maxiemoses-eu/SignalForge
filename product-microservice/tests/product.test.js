const request = require('supertest');
const app = require('../app'); 

describe('Product Service Security Tests', () => {
  // Test 1: Verify Helmet is protecting the app
  test('Should have security headers enabled (Helmet)', async () => {
    const response = await request(app).get('/products');
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  // Test 2: Verify Auth is required for sensitive actions
  test('Should return 401 for unauthenticated product deletion', async () => {
    const response = await request(app).delete('/products/123');
    expect(response.status).toBe(401); 
  });
});