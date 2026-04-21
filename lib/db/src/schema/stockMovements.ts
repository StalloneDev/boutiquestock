import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";
import { productVariantsTable } from "./productVariants";

export const movementTypeEnum = pgEnum("movement_type", ["entry", "exit", "adjustment", "sale"]);

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  variantId: integer("variant_id").references(() => productVariantsTable.id),
  type: movementTypeEnum("type").notNull(),
  delta: integer("delta").notNull(),
  quantityBefore: integer("quantity_before").notNull(),
  quantityAfter: integer("quantity_after").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
