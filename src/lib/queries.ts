import {
  and,
  arrayOverlaps,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
} from 'drizzle-orm';

const inArrayCondition = inArray;
import { db } from '../db/client.ts';
import {
  categories,
  contentBlocks,
  coupons,
  customColors,
  products,
  productImages,
} from '../db/schema.ts';
import type {
  Category,
  ContentBlock,
  Coupon,
  CustomColor,
  NewContentBlock,
  NewCoupon,
  NewCustomColor,
  NewProduct,
  NewProductImage,
  Product,
  ProductImage,
} from '../db/schema.ts';

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

export async function getProductImageById(
  imageId: string
): Promise<ProductImage | null> {
  const [row] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.id, imageId))
    .limit(1);
  return row ?? null;
}

export async function addProductImage(
  data: NewProductImage
): Promise<ProductImage> {
  const existing = await getProductImages(data.productId);
  const nextSort = existing.reduce((a, b) => Math.max(a, b.sortOrder + 1), 0);
  const isHero = data.isHero ?? existing.length === 0;
  if (isHero && existing.some((i) => i.isHero)) {
    await db
      .update(productImages)
      .set({ isHero: false })
      .where(eq(productImages.productId, data.productId));
  }
  const [row] = await db
    .insert(productImages)
    .values({
      ...data,
      sortOrder: data.sortOrder ?? nextSort,
      isHero,
    })
    .returning();
  return row!;
}

export async function deleteProductImage(imageId: string): Promise<ProductImage | null> {
  const [row] = await db
    .delete(productImages)
    .where(eq(productImages.id, imageId))
    .returning();
  if (!row) return null;
  // Si era hero y quedaban imágenes, promover la primera
  if (row.isHero) {
    const rest = await getProductImages(row.productId);
    if (rest.length > 0) {
      await db
        .update(productImages)
        .set({ isHero: true })
        .where(eq(productImages.id, rest[0]!.id));
    }
  }
  return row;
}

export async function setProductHeroImage(
  productId: string,
  imageId: string
): Promise<boolean> {
  await db
    .update(productImages)
    .set({ isHero: false })
    .where(eq(productImages.productId, productId));
  const [row] = await db
    .update(productImages)
    .set({ isHero: true })
    .where(
      and(
        eq(productImages.productId, productId),
        eq(productImages.id, imageId)
      )
    )
    .returning();
  return !!row;
}

export async function updateProductImageAlt(
  imageId: string,
  alt: string
): Promise<ProductImage | null> {
  const [row] = await db
    .update(productImages)
    .set({ alt })
    .where(eq(productImages.id, imageId))
    .returning();
  return row ?? null;
}

/**
 * Devuelve los productos con su hero image (URL) si existe.
 * Útil para tienda/home/related products para mostrar fotos reales.
 */
export async function getProductsWithHero(
  filter: ProductFilter = {}
): Promise<Array<Product & { heroImage: string | null }>> {
  return withHeroes(await getProducts(filter));
}

export async function getFeaturedProductsWithHero(
  limit = 4
): Promise<Array<Product & { heroImage: string | null }>> {
  return withHeroes(await getFeaturedProducts(limit));
}

export async function getRelatedProductsWithHero(
  productId: string,
  categoryId: string,
  limit = 4
): Promise<Array<Product & { heroImage: string | null }>> {
  return withHeroes(await getRelatedProducts(productId, categoryId, limit));
}

export async function withHeroes<T extends Product>(
  list: T[]
): Promise<Array<T & { heroImage: string | null }>> {
  if (list.length === 0) return [];
  const ids = list.map((p) => p.id);
  const heros = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
    })
    .from(productImages)
    .where(
      and(
        inArrayCondition(productImages.productId, ids),
        eq(productImages.isHero, true)
      )
    );
  const map = new Map<string, string>(heros.map((h) => [h.productId, h.url]));
  return list.map((p) => ({ ...p, heroImage: map.get(p.id) ?? null }));
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

// ============================================================
// Admin: catálogo (productos)
// ============================================================

export type AdminProductFilter = {
  q?: string;
  categoryId?: string;
  stockState?: 'all' | 'critical' | 'low' | 'ok' | 'zero';
  status?: 'all' | 'published' | 'draft' | 'sale';
};

export async function getAdminProducts(
  filter: AdminProductFilter = {}
): Promise<Product[]> {
  const conds = [];
  if (filter.q && filter.q.trim().length > 0) {
    const needle = `%${filter.q.trim()}%`;
    const qCond = or(
      ilike(products.name, needle),
      ilike(products.sku, needle),
      ilike(products.description, needle),
      ilike(products.slug, needle)
    );
    if (qCond) conds.push(qCond);
  }
  if (filter.categoryId && filter.categoryId !== 'all') {
    conds.push(eq(products.categoryId, filter.categoryId));
  }
  if (filter.status === 'published') conds.push(eq(products.isPublished, true));
  if (filter.status === 'draft') conds.push(eq(products.isPublished, false));
  if (filter.status === 'sale') conds.push(eq(products.status, 'sale'));
  if (filter.stockState === 'zero') conds.push(eq(products.stock, 0));
  if (filter.stockState === 'critical') conds.push(lte(products.stock, 1));
  if (filter.stockState === 'low') conds.push(lte(products.stock, 3));
  if (filter.stockState === 'ok') conds.push(gte(products.stock, 4));
  return db
    .select()
    .from(products)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(products.sortOrder), asc(products.name));
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function getAdminProductSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((r) => r.slug);
}

export async function getAdminProductSkus(): Promise<string[]> {
  const rows = await db
    .select({ sku: products.sku })
    .from(products)
    .where(sql`${products.sku} IS NOT NULL`);
  return rows.map((r) => r.sku!).filter(Boolean);
}

export async function getAdminProductIds(): Promise<string[]> {
  const rows = await db.select({ id: products.id }).from(products);
  return rows.map((r) => r.id);
}

export async function createProduct(data: NewProduct): Promise<Product> {
  const [row] = await db.insert(products).values(data).returning();
  return row!;
}

export async function updateProduct(
  id: string,
  patch: Partial<NewProduct>
): Promise<Product | null> {
  const [row] = await db
    .update(products)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const result = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
  return result.length > 0;
}

export async function getAdminProductsCountByStatus(): Promise<{
  total: number;
  published: number;
  draft: number;
  zero: number;
  sale: number;
}> {
  const [total] = await db.select({ n: count() }).from(products);
  const [published] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.isPublished, true));
  const [draft] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.isPublished, false));
  const [zero] = await db.select({ n: count() }).from(products).where(eq(products.stock, 0));
  const [sale] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.status, 'sale'));
  return {
    total: total?.n ?? 0,
    published: published?.n ?? 0,
    draft: draft?.n ?? 0,
    zero: zero?.n ?? 0,
    sale: sale?.n ?? 0,
  };
}

// ============================================================
// Admin: categorías
// ============================================================

export async function getAdminCategoriesWithCounts(): Promise<
  Array<Category & { productCount: number }>
> {
  const cats = await getCategories();
  const counts = await getCategoryCounts();
  return cats.map((c) => ({ ...c, productCount: counts[c.id] ?? 0 }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const [row] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return row ?? null;
}

export async function createCategory(data: typeof categories.$inferInsert): Promise<Category> {
  const [row] = await db.insert(categories).values(data).returning();
  return row!;
}

export async function updateCategory(
  id: string,
  patch: Partial<typeof categories.$inferInsert>
): Promise<Category | null> {
  const [row] = await db
    .update(categories)
    .set(patch)
    .where(eq(categories.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCategory(id: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const counts = await getCategoryCounts();
  if ((counts[id] ?? 0) > 0) {
    return { ok: false, reason: `Tiene ${counts[id]} productos asignados.` };
  }
  const result = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  return result.length > 0 ? { ok: true } : { ok: false, reason: 'Categoría no encontrada.' };
}

// ============================================================
// Admin: cupones
// ============================================================

export async function getCoupons(): Promise<Coupon[]> {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return row ?? null;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const [row] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function createCoupon(data: NewCoupon): Promise<Coupon> {
  const [row] = await db
    .insert(coupons)
    .values({ ...data, code: data.code.toUpperCase() })
    .returning();
  return row!;
}

export async function updateCoupon(
  id: string,
  patch: Partial<NewCoupon>
): Promise<Coupon | null> {
  const [row] = await db
    .update(coupons)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(coupons.id, id))
    .returning();
  return row ?? null;
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const result = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id });
  return result.length > 0;
}

export type CouponKpis = {
  active: number;
  usesThisMonth: number;
  totalUses: number;
  topByConv: Coupon | null;
};

export async function getCouponKpis(): Promise<CouponKpis> {
  const all = await getCoupons();
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const active = all.filter(
    (c) => c.isActive && (!c.expiresAt || c.expiresAt > now)
  ).length;
  const totalUses = all.reduce((a, b) => a + b.usedCount, 0);
  const usesThisMonth = all
    .filter((c) => c.updatedAt >= startMonth)
    .reduce((a, b) => a + b.usedCount, 0);
  const topByConv = all.length
    ? all.reduce((best, c) =>
        c.usedCount > (best?.usedCount ?? -1) ? c : best,
        all[0] ?? null
      )
    : null;
  return { active, usesThisMonth, totalUses, topByConv };
}

// ============================================================
// Admin: contenido
// ============================================================

export async function getContentBlocks(section?: string): Promise<ContentBlock[]> {
  if (section) {
    return db
      .select()
      .from(contentBlocks)
      .where(eq(contentBlocks.section, section))
      .orderBy(asc(contentBlocks.key));
  }
  return db.select().from(contentBlocks).orderBy(asc(contentBlocks.section), asc(contentBlocks.key));
}

export async function getContentBlock(key: string): Promise<ContentBlock | null> {
  const [row] = await db
    .select()
    .from(contentBlocks)
    .where(eq(contentBlocks.key, key))
    .limit(1);
  return row ?? null;
}

export async function getContentValue(key: string, fallback = ''): Promise<string> {
  const row = await getContentBlock(key);
  return row?.value ?? fallback;
}

export async function upsertContentBlock(
  block: NewContentBlock
): Promise<ContentBlock> {
  const [row] = await db
    .insert(contentBlocks)
    .values(block)
    .onConflictDoUpdate({
      target: contentBlocks.key,
      set: {
        value: block.value,
        section: block.section,
        label: block.label,
        kind: block.kind,
        updatedAt: new Date(),
        updatedBy: block.updatedBy ?? null,
      },
    })
    .returning();
  return row!;
}

export async function updateContentValue(
  key: string,
  value: string,
  updatedBy?: string | null
): Promise<ContentBlock | null> {
  const [row] = await db
    .update(contentBlocks)
    .set({ value, updatedAt: new Date(), updatedBy: updatedBy ?? null })
    .where(eq(contentBlocks.key, key))
    .returning();
  return row ?? null;
}

// ============================================================
// Admin: stock
// ============================================================

export type StockKpis = {
  totalUnits: number;
  criticalCount: number;
  restockCount: number;
  inventoryValue: number;
  productCount: number;
};

export async function getStockKpis(): Promise<StockKpis> {
  const all = await db.select().from(products);
  const totalUnits = all.reduce((a, b) => a + b.stock, 0);
  const criticalCount = all.filter((p) => p.stock <= 1).length;
  const restockCount = all.filter((p) => p.stock <= p.minStock).length;
  const inventoryValue = all.reduce((a, b) => a + b.stock * b.price, 0);
  return {
    totalUnits,
    criticalCount,
    restockCount,
    inventoryValue,
    productCount: all.length,
  };
}

export type StockVariant = {
  productId: string;
  name: string;
  sku: string | null;
  size: string;
  color: string;
  stock: number;
  min: number;
  updatedAt: Date;
};

/**
 * Construye variantes virtuales (talla × color) del stock por producto.
 * Distribuye el stock entre las variantes para mostrar en UI. Esto es una
 * aproximación hasta que tengamos tabla `product_variants` (Phase 4).
 */
export async function getStockVariants(): Promise<StockVariant[]> {
  const all = await db.select().from(products).orderBy(asc(products.sortOrder));
  const variants: StockVariant[] = [];
  for (const p of all) {
    const sizes = p.sizes.length ? p.sizes : ['Única'];
    const colors = p.colors.length ? p.colors : ['#CB674C'];
    const cells = sizes.length * colors.length;
    const base = Math.floor(p.stock / cells);
    let remainder = p.stock - base * cells;
    for (const size of sizes) {
      for (const color of colors) {
        const stock = base + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        variants.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          size,
          color,
          stock,
          min: p.minStock,
          updatedAt: p.updatedAt,
        });
      }
    }
  }
  return variants;
}

// ============================================================
// Admin: colores personalizados (paleta extendida)
// ============================================================

export async function getCustomColors(): Promise<CustomColor[]> {
  return db.select().from(customColors).orderBy(asc(customColors.createdAt));
}

export async function addCustomColor(
  data: NewCustomColor
): Promise<CustomColor | null> {
  const [row] = await db
    .insert(customColors)
    .values(data)
    .onConflictDoNothing({ target: customColors.hex })
    .returning();
  return row ?? null;
}

export async function removeCustomColor(hex: string): Promise<boolean> {
  const result = await db
    .delete(customColors)
    .where(eq(customColors.hex, hex.toUpperCase()))
    .returning({ hex: customColors.hex });
  return result.length > 0;
}
