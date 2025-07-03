import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'investment', 'savings'
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  routingNumber: text("routing_number").notNull(),
  accountNumber: text("account_number").notNull(),
  isFixed: boolean("is_fixed").default(false),
  fixedUntil: timestamp("fixed_until"),
  monthlyReturn: decimal("monthly_return", { precision: 12, scale: 2 }),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'debit', 'credit'
  date: timestamp("date").defaultNow(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
});

export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  fromAccountId: integer("from_account_id").notNull(),
  toAccountId: integer("to_account_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  serviceCharge: decimal("service_charge", { precision: 12, scale: 2 }).default("0"),
  forfeitedReturn: decimal("forfeited_return", { precision: 12, scale: 2 }).default("0"),
  status: text("status").notNull().default("completed"),
  date: timestamp("date").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  date: true,
});

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  date: true,
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const transferSchema = z.object({
  fromAccountId: z.number(),
  toAccountId: z.number(),
  amount: z.number().positive(),
  description: z.string().optional(),
  routingNumber: z.string().length(9),
  accountNumber: z.string().min(4),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type TransferData = z.infer<typeof transferSchema>;
