import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  or,
} from 'drizzle-orm';
import { db } from '../db/client.ts';
import { categories, products, productImages } from '../db/schema.ts';
import type { Category, Product, ProductImage } from '../db/schema.ts';

export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return row ?? null;
}

export type ProductFilter = {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
  q?: string;
  sort?: 'featured' | 'new' | 'price-asc' | 'price-desc';
};

export async function getProducts(
  filter: ProductFilter = {}
): Promise<Product[]> {
  const conds = [];
  if (filter.categoryId && filter.categoryId !== 'all') {
    conds.push(eq(products.categoryId, filter.categoryId));
  }
  if (typeof filter.minPrice === 'number') {
    conds.push(gte(products.price, filter.minPrice));
  }
  if (typeof filter.maxPrice === 'number') {
    conds.push(lte(products.price, filter.maxPrice));
  }
  if (filter.colors && filter.colors.length > 0) {
    conds.push(arrayOverlaps(products.colors, filter.colors));
  }
  if (filter.sizes && filter.sizes.length > 0) {
    conds.push(arrayOverlaps(products.sizes, filter.sizes));
  }
  if (filter.q && filter.q.trim().length > 0) {
    const needle = `%${filter.q.trim()}%`;
    const qCond = or(
      ilike(products.name, needle),
      ilike(products.description, needle)
    );
    if (qCond) conds.push(qCond);
  }

  const order =
    filter.sort === 'price-asc'
      ? asc(products.price)
      : filter.sort === 'price-desc'
        ? desc(products.price)
        : filter.sort === 'new'
          ? desc(products.createdAt)
          : asc(products.sortOrder);

  return db
    .select()
    .from(products)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(order);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(eq(products.isFeatured, true))
    .orderBy(asc(products.sortOrder))
    .limit(limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getAllProductSlugs(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  return db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .orderBy(asc(products.sortOrder));
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<Product[]> {
  const sameCategory = await db
    .select()
    .from(products)
    .where(
      and(eq(products.categoryId, categoryId), ne(products.id, productId))
    )
    .orderBy(asc(products.sortOrder))
    .limit(limit);

  if (sameCategory.length >= limit) return sameCategory;

  const remaining = limit - sameCategory.length;
  const seenIds = new Set(sameCategory.map((p) => p.id).concat(productId));

  const fillers = await db
    .select()
    .from(products)
    .where(ne(products.id, productId))
    .orderBy(asc(products.sortOrder))
    .limit(remaining + sameCategory.length);

  const merged = [...sameCategory];
  for (const p of fillers) {
    if (merged.length >= limit) break;
    if (!seenIds.has(p.id)) {
      merged.push(p);
      seenIds.add(p.id);
    }
  }
  return merged;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      categoryId: products.categoryId,
      n: count(),
    })
    .from(products)
    .groupBy(products.categoryId);
  return Object.fromEntries(rows.map((r) => [r.categoryId, r.n]));
}

export async function getTotalProductCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(products);
  return row?.n ?? 0;
}

export async function getProductImages(
  productId: string
): Promise<ProductImage[]> {
  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder));
}

export async function getHeroImage(
  productId: string
): Promise<ProductImage | null> {
  const [row] = await db
    .select()
    .from(productImages)
    .where(
      and(
        eq(productImages.productId, productId),
        eq(productImages.isHero, true)
      )
    )
    .limit(1);
  return row ?? null;
}

// ============================================================
// Admin queries (only consumed from /admin/**)
// ============================================================

const LOW_STOCK_THRESHOLD = 3;

export async function getAdminProductCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(products);
  return row?.n ?? 0;
}

export type LowStockItem = Pick<Product, 'id' | 'slug' | 'name' | 'stock'>;

export async function getAdminLowStock(
  threshold: number = LOW_STOCK_THRESHOLD
): Promise<LowStockItem[]> {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      stock: products.stock,
    })
    .from(products)
    .where(lte(products.stock, threshold))
    .orderBy(asc(products.stock), asc(products.name));
}

export type TopValueItem = Pick<Product, 'id' | 'slug' | 'name' | 'price'>;

export async function getAdminTopValueProducts(
  limit = 5
): Promise<TopValueItem[]> {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
    })
    .from(products)
    .orderBy(desc(products.price))
    .limit(limit);
}
