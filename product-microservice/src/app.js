import express from 'express';
import helmet from 'helmet';
import { ProductStore } from './store.js';
import { isUuid, parsePagination, validateProduct } from './validation.js';

const fail = (res, status, message, details) =>
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });

export function createApp({ store = new ProductStore() } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));

  // --- Health probes (use these for Kubernetes liveness/readiness) ---
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => {
    try {
      await store.ping();
      res.json({ status: 'ready' });
    } catch {
      fail(res, 503, 'Service not ready');
    }
  });

  // --- Products ---
  app.get('/products', async (req, res) => {
    const page = parsePagination(req.query);
    if (page.errors) return fail(res, 400, 'Invalid query parameters', page.errors);

    const { items, total } = await store.list(page.value);
    res.json({ items, total, limit: page.value.limit, offset: page.value.offset });
  });

  app.get('/products/:id', async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, 400, 'id must be a valid UUID');
    const product = await store.get(req.params.id);
    if (!product) return fail(res, 404, 'Product not found');
    res.json(product);
  });

  app.post('/products', async (req, res) => {
    const { value, errors } = validateProduct(req.body, { partial: false });
    if (errors) return fail(res, 400, 'Validation failed', errors);

    const result = await store.create(value);
    if (result.conflict) return fail(res, 409, 'A product with this sku already exists');
    res.status(201).location(`/products/${result.product.id}`).json(result.product);
  });

  const update = (partial) => async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, 400, 'id must be a valid UUID');
    const { value, errors } = validateProduct(req.body, { partial });
    if (errors) return fail(res, 400, 'Validation failed', errors);

    const result = await store.update(req.params.id, value);
    if (result.notFound) return fail(res, 404, 'Product not found');
    if (result.conflict) return fail(res, 409, 'A product with this sku already exists');
    res.json(result.product);
  };
  app.put('/products/:id', update(false));
  app.patch('/products/:id', update(true));

  app.delete('/products/:id', async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, 400, 'id must be a valid UUID');
    const removed = await store.remove(req.params.id);
    if (!removed) return fail(res, 404, 'Product not found');
    res.status(204).end();
  });

  // --- 404 + error handling ---
  app.use((_req, res) => fail(res, 404, 'Route not found'));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'Malformed JSON body');
    if (err.type === 'entity.too.large') return fail(res, 413, 'Request body too large');
    if (err.type === 'charset.unsupported' || err.type === 'encoding.unsupported') {
      return fail(res, 415, 'Unsupported charset or encoding');
    }
    console.error(JSON.stringify({ level: 'error', msg: 'unhandled error', name: err.name }));
    return fail(res, 500, 'Internal server error');
  });

  return app;
}
