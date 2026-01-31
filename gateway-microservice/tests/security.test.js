// Add this to the top of the file to increase timeout for ALL tests in this file
jest.setTimeout(10000); 

test('Security headers should be present (Helmet)', async () => {
  const response = await request(app).get('/health');
  expect(response.headers['x-dns-prefetch-control']).toBeDefined();
}, 10000); // 10s specific timeout