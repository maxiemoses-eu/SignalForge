import { randomUUID } from 'node:crypto';

/**
 * In-memory product repository.
 *
 * This is the persistence seam of the service: app.js only talks to the
 * methods below. To move to PostgreSQL/DynamoDB/etc., implement the same
 * async interface and pass it to createApp({ store }).
 */
export class ProductStore {
  #byId = new Map();
  #idBySku = new Map();

  async list({ limit, offset }) {
    const all = [...this.#byId.values()];
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  async get(id) {
    return this.#byId.get(id) ?? null;
  }

  async create(data) {
    if (this.#idBySku.has(data.sku)) {
      return { conflict: true };
    }
    const now = new Date().toISOString();
    const product = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
    this.#byId.set(product.id, product);
    this.#idBySku.set(product.sku, product.id);
    return { product };
  }

  async update(id, data) {
    const existing = this.#byId.get(id);
    if (!existing) return { notFound: true };

    if (data.sku !== undefined) {
      const owner = this.#idBySku.get(data.sku);
      if (owner !== undefined && owner !== id) return { conflict: true };
    }

    const product = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    if (existing.sku !== product.sku) {
      this.#idBySku.delete(existing.sku);
      this.#idBySku.set(product.sku, id);
    }
    this.#byId.set(id, product);
    return { product };
  }

  async remove(id) {
    const existing = this.#byId.get(id);
    if (!existing) return false;
    this.#byId.delete(id);
    this.#idBySku.delete(existing.sku);
    return true;
  }

  async ping() {
    return true;
  }
}
