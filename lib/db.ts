import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql/web";
import type { LibSQLDatabase } from "drizzle-orm/libsql/driver-core";
import * as schema from "./schema";

/**
 * SEMENTARA UJI SAJA — rahasia di sini ikut ke git & siapa pun bisa pakai DB-mu.
 * Hapus konstanta ini & pakai env saja; lalu rotate token di Turso.
 */
const DEV_FALLBACK_DATABASE_URL =
  "libsql://aurora-nazrul-dev.aws-ap-northeast-1.turso.io";
const DEV_FALLBACK_TURSO_AUTH_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYzNTg1ODIsImlkIjoiMDE5ZDk3MzYtNTIwMS03ZjI2LThlMDYtMDA0NjlkN2VmYTI2IiwicmlkIjoiNWNmMGE4M2YtYjIyMS00NmUwLTk2NWItNDc0NzYyOWUxNWJkIn0.IW6Y744RPzTDqhz7dlEh038Qvmk2gKwazNqLm1tiymEnMRtk6mPvY4FQ0Q4ElEllta1sx0iVmyvMNCIfORGeDQ";

let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

function isRemoteUrl(url: string): boolean {
  return (
    url.startsWith("libsql:") ||
    url.startsWith("https:") ||
    url.startsWith("wss:")
  );
}

function getDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  if (u) return u;
  return DEV_FALLBACK_DATABASE_URL;
}

export function getClient(): Client {
  if (_client) return _client;
  const url = getDatabaseUrl();
  const fromEnv = process.env.TURSO_AUTH_TOKEN?.trim();
  const authToken = fromEnv || DEV_FALLBACK_TURSO_AUTH_TOKEN;
  const useAuth = isRemoteUrl(url) && Boolean(authToken);

  _client = useAuth
    ? createClient({ url, authToken })
    : createClient({ url });
  return _client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (_db) return _db;
  _db = drizzle(getClient(), { schema });
  return _db;
}
