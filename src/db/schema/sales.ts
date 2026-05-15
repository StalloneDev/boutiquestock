import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { productsTable } from "./products";
import { productVariantsTable } from "./productVariants";

import { cashRegisterSessionsTable } from "./sessions";
import { usersTable } from "./users";

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => cashRegisterSessionsTable.id),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  variantId: integer("variant_id").references(() => productVariantsTable.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["completed", "cancelled"] }).default("completed").notNull(),
  notes: text("notes"),
  cashierId: integer("cashier_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true }) as any;
export type InsertSale = any;
export type Sale = typeof salesTable.$inferSelect;
