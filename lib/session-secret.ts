/**
 * Pakai `SESSION_SECRET` di env bila ada (≥16 char).
 * Fallback hanya supaya lokal / uji cepat jalan — **wajib set env di production**.
 */
const FALLBACK_SESSION_SECRET =
  "aurora-local-fallback-session-key-32!!";

export function getSessionSecretKey(): Uint8Array {
  const s = process.env.SESSION_SECRET?.trim();
  const raw = s && s.length >= 16 ? s : FALLBACK_SESSION_SECRET;
  return new TextEncoder().encode(raw);
}
