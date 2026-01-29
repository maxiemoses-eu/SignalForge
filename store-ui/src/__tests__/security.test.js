const request = require('supertest');
const app = require('../index');

describe('SignalForge Security Validation', () => {
    test('Gateway hides server signature', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    test('Gateway applies nosniff header', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('Health check returns SignalForge identity', async () => {
        const res = await request(app).get('/health');
        expect(res.body.project).toBe('SignalForge');
    });
});