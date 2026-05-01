import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
    name: text('name').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    price: integer('price').notNull(),
    oldPrice: integer('old_price'),
    status: productStatus('status'),
    stock: integer('stock').notNull().default(0),
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
  ]
);

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type NewProduct = typeof products.$inferInsert;
