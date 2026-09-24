import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

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

const json = (method, path, body) =>
  fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const sample = (overrides = {}) => ({
  name: 'Widget',
  description: 'A test widget',
  price: 19.99,
  currency: 'USD',
  sku: `SKU-${Math.random().toString(36).slice(2, 10)}`,
  stock: 5,
  ...overrides,
});

describe('health', () => {
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

  it('sets security headers and hides x-powered-by', async () => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });
});

describe('products CRUD', () => {
  it('creates, reads, updates, patches and deletes a product', async () => {
    const created = await json('POST', '/products', sample({ sku: 'CRUD-1' }));
    assert.equal(created.status, 201);
    const product = await created.json();
    assert.match(product.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.headers.get('location'), `/products/${product.id}`);

    const got = await fetch(`${base}/products/${product.id}`);
    assert.equal(got.status, 200);
    assert.equal((await got.json()).sku, 'CRUD-1');

    const put = await json('PUT', `/products/${product.id}`, sample({ sku: 'CRUD-1', name: 'Renamed', price: 5 }));
    assert.equal(put.status, 200);
    const putBody = await put.json();
    assert.equal(putBody.name, 'Renamed');
    assert.equal(putBody.createdAt, product.createdAt);

    const patch = await json('PATCH', `/products/${product.id}`, { stock: 42 });
    assert.equal(patch.status, 200);
    const patched = await patch.json();
    assert.equal(patched.stock, 42);
    assert.equal(patched.name, 'Renamed');

    const del = await fetch(`${base}/products/${product.id}`, { method: 'DELETE' });
    assert.equal(del.status, 204);
    const gone = await fetch(`${base}/products/${product.id}`);
    assert.equal(gone.status, 404);
  });

  it('applies defaults for optional fields', async () => {
    const res = await json('POST', '/products', { name: 'Min', price: 1, sku: 'DEFAULTS-1' });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.currency, 'USD');
    assert.equal(body.stock, 0);
    assert.equal(body.description, '');
  });

  it('lists with pagination', async () => {
    for (let i = 0; i < 3; i += 1) await json('POST', '/products', sample({ sku: `PAGE-${i}` }));
    const res = await fetch(`${base}/products?limit=2&offset=0`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.items.length, 2);
    assert.equal(body.limit, 2);
    assert.ok(body.total >= 3);
  });

  it('a freed sku can be reused after delete', async () => {
    const a = await (await json('POST', '/products', sample({ sku: 'REUSE-1' }))).json();
    await fetch(`${base}/products/${a.id}`, { method: 'DELETE' });
    const again = await json('POST', '/products', sample({ sku: 'REUSE-1' }));
    assert.equal(again.status, 201);
  });
});

describe('validation and errors', () => {
  it('rejects a duplicate sku with 409', async () => {
    await json('POST', '/products', sample({ sku: 'DUP-1' }));
    const res = await json('POST', '/products', sample({ sku: 'DUP-1' }));
    assert.equal(res.status, 409);
  });

  it('rejects PATCH to another product\'s sku with 409', async () => {
    await json('POST', '/products', sample({ sku: 'OWNED-1' }));
    const other = await (await json('POST', '/products', sample({ sku: 'OWNED-2' }))).json();
    const res = await json('PATCH', `/products/${other.id}`, { sku: 'OWNED-1' });
    assert.equal(res.status, 409);
  });

  for (const [label, payload] of [
    ['missing required fields', {}],
    ['negative price', sample({ price: -1 })],
    ['price with 3 decimals', sample({ price: 1.234 })],
    ['string price', sample({ price: '10' })],
    ['bad currency', sample({ currency: 'usd' })],
    ['bad sku characters', sample({ sku: 'has space' })],
    ['fractional stock', sample({ stock: 1.5 })],
    ['unknown field', sample({ isAdmin: true })],
    ['array body', []],
  ]) {
    it(`400 on ${label}`, async () => {
      const res = await json('POST', '/products', payload);
      assert.equal(res.status, 400);
      assert.ok((await res.json()).error.message);
    });
  }

  it('400 on empty PATCH', async () => {
    const p = await (await json('POST', '/products', sample())).json();
    const res = await json('PATCH', `/products/${p.id}`, {});
    assert.equal(res.status, 400);
  });

  it('400 on malformed JSON', async () => {
    const res = await fetch(`${base}/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not json',
    });
    assert.equal(res.status, 400);
  });

  it('413 on oversized body', async () => {
    const res = await json('POST', '/products', sample({ description: 'x'.repeat(20_000) }));
    assert.equal(res.status, 413);
  });

  it('400 on non-UUID id, 404 on unknown UUID', async () => {
    assert.equal((await fetch(`${base}/products/not-a-uuid`)).status, 400);
    assert.equal((await fetch(`${base}/products/00000000-0000-4000-8000-000000000000`)).status, 404);
  });

  it('400 on bad pagination', async () => {
    assert.equal((await fetch(`${base}/products?limit=0`)).status, 400);
    assert.equal((await fetch(`${base}/products?limit=abc`)).status, 400);
    assert.equal((await fetch(`${base}/products?offset=-1`)).status, 400);
  });

  it('404 JSON on unknown route', async () => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
    assert.ok((await res.json()).error);
  });
});
