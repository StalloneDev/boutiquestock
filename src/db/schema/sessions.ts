import { pgTable, serial, numeric, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { usersTable } from "./users";

export const cashRegisterSessionsTable = pgTable("cash_register_sessions", {
  id: serial("id").primaryKey(),
  status: text("status", { enum: ["open", "closed"] }).default("open").notNull(),
  openingTime: timestamp("opening_time", { withTimezone: true }).defaultNow().notNull(),
  closingTime: timestamp("closing_time", { withTimezone: true }),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull(),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
  notes: text("notes"),
  openedBy: integer("opened_by").references(() => usersTable.id),
  closedBy: integer("closed_by").references(() => usersTable.id),
});

export const insertSessionSchema = createInsertSchema(cashRegisterSessionsTable).omit({ id: true }) as any;
export type InsertSession = any;
export type Session = typeof cashRegisterSessionsTable.$inferSelect;
