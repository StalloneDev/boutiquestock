import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const discountLogsTable = pgTable("discount_logs", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).notNull(),
  priceBeforeDiscount: numeric("price_before_discount", { precision: 12, scale: 2 }).notNull(),
  priceAfterDiscount: numeric("price_after_discount", { precision: 12, scale: 2 }).notNull(),
  appliedBy: integer("applied_by").references(() => usersTable.id),
  batchId: text("batch_id").notNull(), // UUID pour regrouper les remises d'une même opération
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDiscountLogSchema = createInsertSchema(discountLogsTable).omit({ id: true, createdAt: true });
export type InsertDiscountLog = typeof discountLogsTable.$inferInsert;
export type DiscountLog = typeof discountLogsTable.$inferSelect;
