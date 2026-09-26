import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

const json = (base, method, path, body) =>
  fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe('health', () => {
  let server;
  let base;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /healthz', async () => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
  });

  it('GET /readyz', async () => {
    const res = await fetch(`${base}/readyz`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ready' });
  });
});

describe('store UI products', () => {
  let server;
  let appBase;

  before(async () => {
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    appBase = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it('lists products', async () => {
    const res = await fetch(`${appBase}/ui/products`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.total, 0);
    assert.equal(data.items.length, 0);
  });

  it('creates a product', async () => {
    const res = await json(appBase, 'POST', '/ui/products', { name: 'Widget', sku: 'PROD-1', price: 19.99 });
    assert.equal(res.status, 201);
    const product = await res.json();
    assert.equal(product.name, 'Widget');
    assert.equal(product.sku, 'PROD-1');
    assert.equal(product.price, 19.99);
    assert.ok(product.id);
  });

  it('gets a product', async () => {
    const created = await (await json(appBase, 'POST', '/ui/products', { name: 'Item', sku: 'ITEM-1' })).json();
    const res = await fetch(`${appBase}/ui/products/${created.id}`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).sku, 'ITEM-1');
  });

  it('deletes a product', async () => {
    const created = await (await json(appBase, 'POST', '/ui/products', { name: 'X', sku: 'X-1' })).json();
    const res = await fetch(`${appBase}/ui/products/${created.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);
    const gone = await fetch(`${appBase}/ui/products/${created.id}`);
    assert.equal(gone.status, 404);
  });

  it('rejects duplicate sku with 409', async () => {
    await json(appBase, 'POST', '/ui/products', { name: 'A', sku: 'DUP' });
    const res = await json(appBase, 'POST', '/ui/products', { name: 'B', sku: 'DUP' });
    assert.equal(res.status, 409);
  });

  it('400 on missing name', async () => {
    const res = await json(appBase, 'POST', '/ui/products', { sku: 'SKU' });
    assert.equal(res.status, 400);
  });

  it('400 on missing sku', async () => {
    const res = await json(appBase, 'POST', '/ui/products', { name: 'Name' });
    assert.equal(res.status, 400);
  });

  it('404 on unknown product', async () => {
    const res = await fetch(`${appBase}/ui/products/unknown`);
    assert.equal(res.status, 404);
  });
});
