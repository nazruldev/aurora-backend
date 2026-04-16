import { and, desc, eq } from "drizzle-orm";
import { customAlphabet, nanoid } from "nanoid";
import { getDb } from "./db";
import { accessCodes, type AccessCodeStatus } from "./schema";

const genCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 12);

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function generateCodes(opts: {
  count: number;
  note?: string | null;
  expiresAt?: string | null;
  batchId?: string | null;
}): Promise<{ batchId: string; codes: string[] }> {
  const db = getDb();
  const batchId = (opts.batchId?.trim() || nanoid()).slice(0, 64);
  const n = Math.min(500, Math.max(1, Math.floor(opts.count)));
  const rows: { code: string; batchId: string; note: string | null; expiresAt: string | null }[] = [];
  const seen = new Set<string>();
  while (rows.length < n) {
    const c = genCode();
    if (seen.has(c)) continue;
    seen.add(c);
    rows.push({
      code: c,
      batchId,
      note: opts.note?.trim() || null,
      expiresAt: opts.expiresAt?.trim() || null,
    });
  }
  await db.insert(accessCodes).values(rows);
  return { batchId, codes: rows.map((r) => r.code) };
}

export async function listCodes(filter?: {
  status?: AccessCodeStatus;
  batchId?: string;
}) {
  const db = getDb();
  const conds = [];
  if (filter?.status) conds.push(eq(accessCodes.status, filter.status));
  if (filter?.batchId) conds.push(eq(accessCodes.batchId, filter.batchId));
  const where = conds.length ? and(...conds) : undefined;
  return db
    .select()
    .from(accessCodes)
    .where(where)
    .orderBy(desc(accessCodes.id));
}

export async function updateCodeStatus(id: number, status: AccessCodeStatus) {
  const db = getDb();
  await db
    .update(accessCodes)
    .set({ status })
    .where(eq(accessCodes.id, id))
    .run();
}

export type ValidateResult =
  | { valid: true; code: string }
  | { valid: false; reason: string };

export async function validateAndConsumeCode(raw: string): Promise<ValidateResult> {
  const code = normalizeCode(raw);
  if (!code) return { valid: false, reason: "empty" };

  const db = getDb();
  const row = await db
    .select()
    .from(accessCodes)
    .where(eq(accessCodes.code, code))
    .get();

  if (!row) return { valid: false, reason: "not_found" };
  if (row.status !== "active") {
    return { valid: false, reason: row.status === "used" ? "used" : "inactive" };
  }
  if (row.expiresAt) {
    const t = Date.parse(row.expiresAt);
    if (!Number.isNaN(t) && t < Date.now()) {
      await db
        .update(accessCodes)
        .set({ status: "inactive" })
        .where(eq(accessCodes.id, row.id))
        .run();
      return { valid: false, reason: "expired" };
    }
  }

  const usedAt = new Date().toISOString();
  const r = await db
    .update(accessCodes)
    .set({ status: "used", usedAt })
    .where(and(eq(accessCodes.id, row.id), eq(accessCodes.status, "active")))
    .run();

  const affected =
    typeof (r as { rowsAffected?: number }).rowsAffected === "number"
      ? (r as { rowsAffected: number }).rowsAffected
      : (r as { changes?: number }).changes ?? 0;
  if (affected < 1) {
    return { valid: false, reason: "race_or_inactive" };
  }

  return { valid: true, code };
}
