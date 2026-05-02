import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';

beforeAll(() => {
  // Cargar .env si DATABASE_URL no está seteada (CI la setea explícitamente).
  if (!process.env.DATABASE_URL) {
    try {
      for (const line of readFileSync('.env', 'utf8').split('\n')) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]!]) {
          process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
        }
      }
    } catch {
      /* .env opcional en CI */
    }
  }
});

describe('queries (read-only against seeded DB)', () => {
  it('getCategories: 6 filas ordenadas por sortOrder asc', async () => {
    const { getCategories } = await import('~/lib/queries');
    const cats = await getCategories();
    expect(cats).toHaveLength(6);
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i]!.sortOrder).toBeGreaterThanOrEqual(cats[i - 1]!.sortOrder);
    }
  });

  it('getProducts: 12 filas ordenadas por sortOrder asc', async () => {
    const { getProducts } = await import('~/lib/queries');
    const prods = await getProducts();
    expect(prods).toHaveLength(12);
    for (let i = 1; i < prods.length; i++) {
      expect(prods[i]!.sortOrder).toBeGreaterThanOrEqual(prods[i - 1]!.sortOrder);
    }
  });

  it('getProducts({ categoryId: "sweaters" }): 3 productos', async () => {
    const { getProducts } = await import('~/lib/queries');
    const sweaters = await getProducts({ categoryId: 'sweaters' });
    expect(sweaters).toHaveLength(3);
    for (const p of sweaters) {
      expect(p.categoryId).toBe('sweaters');
    }
  });

  it('getProducts({ minPrice, maxPrice }): todos los precios en rango', async () => {
    const { getProducts } = await import('~/lib/queries');
    const inRange = await getProducts({ minPrice: 80000, maxPrice: 120000 });
    expect(inRange.length).toBeGreaterThan(0);
    for (const p of inRange) {
      expect(p.price).toBeGreaterThanOrEqual(80000);
      expect(p.price).toBeLessThanOrEqual(120000);
    }
  });

  it('getProducts({ sort: "price-desc" }): el más caro va primero', async () => {
    const { getProducts } = await import('~/lib/queries');
    const sorted = await getProducts({ sort: 'price-desc' });
    expect(sorted.length).toBe(12);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1]!.price).toBeGreaterThanOrEqual(sorted[i]!.price);
    }
  });

  it('getProductBySlug("sweater-otono-terracota"): no null, name correcto', async () => {
    const { getProductBySlug } = await import('~/lib/queries');
    const p = await getProductBySlug('sweater-otono-terracota');
    expect(p).not.toBeNull();
    expect(p?.name).toBe('Sweater Otoño Terracota');
  });

  it('getProductBySlug("inexistente"): null', async () => {
    const { getProductBySlug } = await import('~/lib/queries');
    const p = await getProductBySlug('inexistente');
    expect(p).toBeNull();
  });

  it('getCategoryCounts: la suma total === 12', async () => {
    const { getCategoryCounts } = await import('~/lib/queries');
    const counts = await getCategoryCounts();
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(total).toBe(12);
  });
});

afterAll(async () => {
  const { pool } = await import('~/db/client');
  await pool.end();
});
