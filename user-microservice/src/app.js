import express from 'express';
import helmet from 'helmet';

const fail = (res, status, message, details) =>
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });

const isValidEmail = (email) => typeof email === 'string' && email.includes('@');

export function createApp() {
  const app = express();
  const users = new Map();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => res.json({ status: 'ready' }));

  app.get('/users', (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '20', 10) || 20, 1), 100);
    const offset = Math.max(Number.parseInt(req.query.offset ?? '0', 10) || 0, 0);
    if (Number.isNaN(limit) || Number.isNaN(offset)) return fail(res, 400, 'Invalid pagination');

    const items = Array.from(users.values());
    res.json({ items: items.slice(offset, offset + limit), total: items.length, limit, offset });
  });

  app.get('/users/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    res.json(user);
  });

  app.post('/users', (req, res) => {
    if (!isValidEmail(req.body?.email)) {
      return fail(res, 400, 'email is required and must be valid');
    }
    if (typeof req.body?.name !== 'string' || req.body.name.trim().length === 0) {
      return fail(res, 400, 'name is required');
    }

    const email = req.body.email.toLowerCase().trim();
    if (Array.from(users.values()).some((u) => u.email === email)) {
      return fail(res, 409, 'Email already registered');
    }

    const id = `user-${Date.now()}`;
    const user = {
      id,
      name: req.body.name.trim(),
      email,
      role: req.body.role || 'user',
      created_at: new Date().toISOString(),
    };
    users.set(id, user);
    res.status(201).location(`/users/${id}`).json(user);
  });

  app.patch('/users/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return fail(res, 404, 'User not found');

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        return fail(res, 400, 'name must be non-empty string');
      }
      user.name = req.body.name.trim();
    }

    if (req.body.role !== undefined) {
      if (typeof req.body.role !== 'string' || !['user', 'admin'].includes(req.body.role)) {
        return fail(res, 400, 'role must be user or admin');
      }
      user.role = req.body.role;
    }

    user.updated_at = new Date().toISOString();
    users.set(req.params.id, user);
    res.json(user);
  });

  app.delete('/users/:id', (req, res) => {
    if (!users.has(req.params.id)) return fail(res, 404, 'User not found');
    users.delete(req.params.id);
    res.status(204).end();
  });

  app.use((_req, res) => fail(res, 404, 'Route not found'));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'Malformed JSON body');
    if (err.type === 'entity.too.large') return fail(res, 413, 'Request body too large');
    console.error(JSON.stringify({ level: 'error', msg: 'unhandled error', name: err.name }));
    return fail(res, 500, 'Internal server error');
  });

  return app;
}
