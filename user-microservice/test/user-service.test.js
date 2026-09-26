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

describe('users', () => {
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

  it('lists users', async () => {
    const res = await fetch(`${appBase}/users`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.total, 0);
  });

  it('creates a user', async () => {
    const res = await json(appBase, 'POST', '/users', { name: 'Alice', email: 'alice@example.com' });
    assert.equal(res.status, 201);
    const user = await res.json();
    assert.equal(user.name, 'Alice');
    assert.equal(user.email, 'alice@example.com');
    assert.equal(user.role, 'user');
  });

  it('gets a user', async () => {
    const created = await (await json(appBase, 'POST', '/users', { name: 'Bob', email: 'bob@example.com' })).json();
    const res = await fetch(`${appBase}/users/${created.id}`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).email, 'bob@example.com');
  });

  it('updates a user', async () => {
    const created = await (await json(appBase, 'POST', '/users', { name: 'Carol', email: 'carol@example.com' })).json();
    const res = await json(appBase, 'PATCH', `/users/${created.id}`, { name: 'Carol Smith', role: 'admin' });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.name, 'Carol Smith');
    assert.equal(updated.role, 'admin');
  });

  it('deletes a user', async () => {
    const created = await (await json(appBase, 'POST', '/users', { name: 'Dave', email: 'dave@example.com' })).json();
    const res = await fetch(`${appBase}/users/${created.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);
    const gone = await fetch(`${appBase}/users/${created.id}`);
    assert.equal(gone.status, 404);
  });

  it('rejects duplicate email with 409', async () => {
    await json(appBase, 'POST', '/users', { name: 'Eve', email: 'eve@example.com' });
    const res = await json(appBase, 'POST', '/users', { name: 'Eve2', email: 'eve@example.com' });
    assert.equal(res.status, 409);
  });

  it('400 on invalid email', async () => {
    const res = await json(appBase, 'POST', '/users', { name: 'X', email: 'notanemail' });
    assert.equal(res.status, 400);
  });

  it('400 on missing name', async () => {
    const res = await json(appBase, 'POST', '/users', { email: 'test@example.com' });
    assert.equal(res.status, 400);
  });

  it('404 on unknown user', async () => {
    const res = await fetch(`${appBase}/users/unknown`);
    assert.equal(res.status, 404);
  });
});
