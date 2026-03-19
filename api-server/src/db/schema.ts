import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  varchar,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 64 }).notNull().unique(),
  username: varchar('username', { length: 128 }),
  firstName: varchar('first_name', { length: 128 }),
  lastName: varchar('last_name', { length: 128 }),
  isAdmin: boolean('is_admin').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id),
  name: varchar('name', { length: 256 }).notNull(),
  slug: varchar('slug', { length: 256 }).notNull().unique(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 512 }),
  priceStars: integer('price_stars').notNull(), // Telegram Stars price
  priceUsdt: decimal('price_usdt', { precision: 10, scale: 2 }), // USDT price
  fileUrl: text('file_url'), // secure internal path
  fileName: varchar('file_name', { length: 256 }),
  fileSize: integer('file_size'),
  thumbnailUrl: text('thumbnail_url'),
  tags: jsonb('tags').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  paymentMethod: varchar('payment_method', { length: 32 }).notNull(), // 'stars' | 'usdt_trc20'
  status: varchar('status', { length: 32 }).default('pending').notNull(), // pending | paid | failed | refunded
  totalStars: integer('total_stars'),
  totalUsdt: decimal('total_usdt', { precision: 10, scale: 2 }),
  txHash: text('tx_hash'),
  telegramPaymentChargeId: text('telegram_payment_charge_id'),
  usdtWalletAddress: text('usdt_wallet_address'),
  usdtExpectedAmount: decimal('usdt_expected_amount', { precision: 10, scale: 6 }),
  fileDelivered: boolean('file_delivered').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  priceStars: integer('price_stars'),
  priceUsdt: decimal('price_usdt', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1).notNull(),
});

// ─── USDT Payment Monitors ────────────────────────────────────────────────────

export const usdtPayments = pgTable('usdt_payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull().unique(),
  walletAddress: text('wallet_address').notNull(),
  expectedAmount: decimal('expected_amount', { precision: 10, scale: 6 }).notNull(),
  receivedAmount: decimal('received_amount', { precision: 10, scale: 6 }),
  txHash: text('tx_hash'),
  expiresAt: timestamp('expires_at').notNull(),
  confirmedAt: timestamp('confirmed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  usdtPayment: one(usdtPayments, {
    fields: [orders.id],
    references: [usdtPayments.orderId],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type UsdtPayment = typeof usdtPayments.$inferSelect;
