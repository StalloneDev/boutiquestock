import { pgTable, serial, numeric, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";
import { cashRegisterSessionsTable } from "./sessions";

export const expenseStatusEnum = pgEnum("expense_status", ["completed", "cancelled"]);

export const expensesTable = pgTable("expenses", {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id").notNull().references(() => cashRegisterSessionsTable.id),
    userId: integer("user_id").notNull().references(() => usersTable.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    reason: text("reason").notNull(),
    status: expenseStatusEnum("status").notNull().default("completed"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertExpenseSchema = createInsertSchema(expensesTable).omit({ id: true, createdAt: true });
export type InsertExpense = typeof expensesTable.$inferInsert;
export type Expense = typeof expensesTable.$inferSelect;
