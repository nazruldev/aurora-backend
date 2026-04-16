import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql/web";
import type { LibSQLDatabase } from "drizzle-orm/libsql/driver-core";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

function getDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  if (u) return u;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, "app.db").replace(/\\/g, "/");
  return `file:${fp}`;
}

export function getClient(): Client {
  if (_client) return _client;
  const url = getDatabaseUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  _client = authToken
    ? createClient({ url, authToken })
    : createClient({ url });
  return _client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db;
  _db = drizzle(getClient(), { schema });
  return _db;
}
