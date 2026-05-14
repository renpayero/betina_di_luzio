import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const productStatus = pgEnum('product_status', [
  'new',
  'sale',
  'bestseller',
]);

export const categories = pgTable(
  'categories',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    blurb: text('blurb').notNull(),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_categories_sort').on(t.sortOrder)]
);

export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    sku: text('sku').unique(),
    name: text('name').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    price: integer('price').notNull(),
    oldPrice: integer('old_price'),
    status: productStatus('status'),
    stock: integer('stock').notNull().default(0),
    minStock: integer('min_stock').notNull().default(2),
    materials: text('materials').notNull(),
    description: text('description').notNull(),
    placeholder: text('placeholder').notNull(),
    colors: text('colors')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    sizes: text('sizes')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    isFeatured: boolean('is_featured').notNull().default(false),
    isPublished: boolean('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_products_category').on(t.categoryId),
    index('idx_products_price').on(t.price),
    index('idx_products_featured').on(t.isFeatured),
    index('idx_products_status').on(t.status),
    index('idx_products_sort').on(t.sortOrder),
    index('idx_products_published').on(t.isPublished),
  ]
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type NewProduct = typeof products.$inferInsert;

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isHero: boolean('is_hero').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_product_images_product').on(t.productId),
    index('idx_product_images_hero').on(t.productId, t.isHero),
  ]
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export const userRole = pgEnum('user_role', ['admin', 'staff']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: userRole('role').notNull().default('admin'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('idx_users_email').on(t.email)]
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_sessions_user').on(t.userId),
    index('idx_sessions_expires').on(t.expiresAt),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export const couponKind = pgEnum('coupon_kind', [
  'percent',
  'fixed',
  'free_shipping',
]);

export const couponScope = pgEnum('coupon_scope', [
  'all',
  'category',
  'products',
]);

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    kind: couponKind('kind').notNull(),
    value: integer('value').notNull().default(0),
    minPurchase: integer('min_purchase').notNull().default(0),
    scope: couponScope('scope').notNull().default('all'),
    categoryId: text('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('idx_coupons_code').on(t.code),
    index('idx_coupons_active').on(t.isActive),
    index('idx_coupons_expires').on(t.expiresAt),
  ]
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;

export const contentKind = pgEnum('content_kind', ['text', 'rich', 'url', 'image']);

export const contentBlocks = pgTable(
  'content_blocks',
  {
    key: text('key').primaryKey(),
    section: text('section').notNull(),
    label: text('label').notNull(),
    kind: contentKind('kind').notNull().default('text'),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: uuid('updated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [index('idx_content_section').on(t.section)]
);

export type ContentBlock = typeof contentBlocks.$inferSelect;
export type NewContentBlock = typeof contentBlocks.$inferInsert;

export const customColors = pgTable('custom_colors', {
  hex: text('hex').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null',
  }),
});

export type CustomColor = typeof customColors.$inferSelect;
export type NewCustomColor = typeof customColors.$inferInsert;
