const request = require('supertest');
const app = require('../app'); // Ensure this points to product-microservice/app.js

describe('Product Service Security Tests', () => {
  test('Verify Helmet is protecting the app', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-dns-prefetch-control']).toBeDefined();
    expect(response.status).toBe(200);
  }, 10000);
});