const request = require('supertest');
const app = require('../app'); // This imports the express instance from app.js

describe('Product Service Security Tests', () => {

  test('Verify Helmet security is active', async () => {
    const response = await request(app).get('/health');
    
    // Asserts that Helmet middleware is working
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.status).toBe(200);
  }, 10000);

  test('Product health endpoint returns correctly', async () => {
    const response = await request(app).get('/health');
    expect(response.body.service).toBe('product');
    expect(response.body.status).toBe('secure');
  });

});