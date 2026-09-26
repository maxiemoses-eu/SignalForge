import express from 'express';
import helmet from 'helmet';

const fail = (res, status, message, details) =>
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });

export function createApp() {
  const app = express();
  const store = new Map();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => res.json({ status: 'ready' }));

  app.get('/ui/products', (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? '20', 10) || 20, 1), 100);
    const offset = Math.max(Number.parseInt(req.query.offset ?? '0', 10) || 0, 0);
    if (Number.isNaN(limit) || Number.isNaN(offset)) return fail(res, 400, 'Invalid pagination');

    const items = Array.from(store.values());
    res.json({ items: items.slice(offset, offset + limit), total: items.length, limit, offset });
  });

  app.get('/ui/products/:id', (req, res) => {
    const product = store.get(req.params.id);
    if (!product) return fail(res, 404, 'Product not found');
    res.json(product);
  });

  app.post('/ui/products', (req, res) => {
    if (typeof req.body?.name !== 'string' || req.body.name.trim().length === 0) {
      return fail(res, 400, 'name is required');
    }
    if (typeof req.body?.sku !== 'string' || req.body.sku.trim().length === 0) {
      return fail(res, 400, 'sku is required');
    }

    const sku = req.body.sku.trim();
    if (Array.from(store.values()).some((p) => p.sku === sku)) {
      return fail(res, 409, 'SKU already exists');
    }

    const id = `prod-${Date.now()}`;
    const product = {
      id,
      name: req.body.name.trim(),
      sku,
      price: typeof req.body.price === 'number' ? req.body.price : 0,
      image_url: req.body.image_url || '',
      created_at: new Date().toISOString(),
    };
    store.set(id, product);
    res.status(201).location(`/ui/products/${id}`).json(product);
  });

  app.delete('/ui/products/:id', (req, res) => {
    if (!store.has(req.params.id)) return fail(res, 404, 'Product not found');
    store.delete(req.params.id);
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
