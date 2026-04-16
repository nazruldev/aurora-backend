import bcrypt from "bcryptjs";
import { getClient, getDb } from "./db";
import { admins } from "./schema";

let migrated = false;
let inflight: Promise<void> | null = null;

/** Idempotent schema + bootstrap admin (first run). */
export async function ensureMigrated(): Promise<void> {
  if (migrated) return;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const c = getClient();
      await c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS access_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','inactive')),
      batch_id TEXT,
      note TEXT,
      expires_at TEXT,
      used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
    CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);
    CREATE INDEX IF NOT EXISTS idx_access_codes_batch ON access_codes(batch_id);
  `);

      const db = getDb();
      const user = (process.env.BOOTSTRAP_ADMIN_USER || "admin")
        .trim()
        .toLowerCase();
      const pass = process.env.BOOTSTRAP_ADMIN_PASSWORD || "015999";
      const hash = bcrypt.hashSync(pass, 10);
      await db
        .insert(admins)
        .values({ username: user, passwordHash: hash })
        .onConflictDoNothing({ target: admins.username });

      migrated = true;
    } finally {
      inflight = null;
    }
  })();

  await inflight;
}
