const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SKU_RE = /^[A-Za-z0-9._-]{1,64}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

const FIELDS = ['name', 'description', 'price', 'currency', 'sku', 'stock'];

export const isUuid = (value) => typeof value === 'string' && UUID_RE.test(value);

const isValidPrice = (p) =>
  typeof p === 'number' &&
  Number.isFinite(p) &&
  p >= 0 &&
  p <= 1_000_000_000 &&
  Math.abs(p * 100 - Math.round(p * 100)) < 1e-6;

/**
 * Validate a product payload. Unknown fields are rejected (no mass assignment).
 * @param {unknown} body
 * @param {{ partial: boolean }} opts partial=true for PATCH, false for POST/PUT
 * @returns {{ value?: object, errors?: string[] }}
 */
export function validateProduct(body, { partial }) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'] };
  }

  const errors = [];
  for (const key of Object.keys(body)) {
    if (!FIELDS.includes(key)) errors.push(`Unknown field: ${key}`);
  }

  const has = (key) => Object.hasOwn(body, key);
  const value = {};

  if (has('name')) {
    if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.length > 120) {
      errors.push('name must be a string of 1-120 characters');
    } else value.name = body.name.trim();
  } else if (!partial) errors.push('name is required');

  if (has('description')) {
    if (typeof body.description !== 'string' || body.description.length > 2000) {
      errors.push('description must be a string of at most 2000 characters');
    } else value.description = body.description;
  } else if (!partial) value.description = '';

  if (has('price')) {
    if (!isValidPrice(body.price)) {
      errors.push('price must be a non-negative number with at most 2 decimal places');
    } else value.price = body.price;
  } else if (!partial) errors.push('price is required');

  if (has('currency')) {
    if (typeof body.currency !== 'string' || !CURRENCY_RE.test(body.currency)) {
      errors.push('currency must be a 3-letter uppercase ISO 4217 code');
    } else value.currency = body.currency;
  } else if (!partial) value.currency = 'USD';

  if (has('sku')) {
    if (typeof body.sku !== 'string' || !SKU_RE.test(body.sku)) {
      errors.push('sku must be 1-64 characters: letters, digits, dot, underscore, hyphen');
    } else value.sku = body.sku;
  } else if (!partial) errors.push('sku is required');

  if (has('stock')) {
    if (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 1_000_000_000) {
      errors.push('stock must be a non-negative integer');
    } else value.stock = body.stock;
  } else if (!partial) value.stock = 0;

  if (partial && errors.length === 0 && Object.keys(value).length === 0) {
    errors.push('Provide at least one field to update');
  }

  return errors.length > 0 ? { errors } : { value };
}

/** Parse ?limit=&offset= with strict bounds. */
export function parsePagination(query) {
  const parse = (raw, fallback, min, max, label) => {
    if (raw === undefined) return { n: fallback };
    if (typeof raw !== 'string' || !/^\d{1,9}$/.test(raw)) return { error: `${label} must be an integer` };
    const n = Number(raw);
    if (n < min || n > max) return { error: `${label} must be between ${min} and ${max}` };
    return { n };
  };
  const limit = parse(query.limit, 20, 1, 100, 'limit');
  const offset = parse(query.offset, 0, 0, 1_000_000, 'offset');
  const errors = [limit.error, offset.error].filter(Boolean);
  return errors.length > 0 ? { errors } : { value: { limit: limit.n, offset: offset.n } };
}
