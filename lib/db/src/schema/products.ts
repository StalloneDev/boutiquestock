import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  quantity: integer("quantity").notNull().default(0),
  unitCostPrice: numeric("unit_cost_price", { precision: 12, scale: 2 }),
  unitSalePrice: numeric("unit_sale_price", { precision: 12, scale: 2 }),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
  notes: text("notes"),
  barcode: text("barcode").unique(),
  imageUrl: text("image_url"),
  hasVariants: integer("has_variants").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
