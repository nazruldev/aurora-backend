import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const accessCodes = sqliteTable("access_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("active"),
  batchId: text("batch_id"),
  note: text("note"),
  expiresAt: text("expires_at"),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export type AccessCodeStatus = "active" | "used" | "inactive";
