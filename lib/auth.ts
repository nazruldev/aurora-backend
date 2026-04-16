import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { admins } from "./schema";
import { ensureMigrated } from "./migrate";
import { getSessionSecretKey } from "./session-secret";

const COOKIE = "access_admin_session";

export { COOKIE };

export type AdminSession = { sub: string; username: string };

export async function signAdminToken(adminId: number, username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(adminId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecretKey());
}

export async function verifyAdminToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecretKey());
    const sub = payload.sub;
    const username = String(payload.username ?? "");
    if (!sub || !username) return null;
    return { sub, username };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  return verifyAdminToken(t);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ ok: false; error: string } | { ok: true; token: string }> {
  await ensureMigrated();
  const db = getDb();
  const u = username.trim().toLowerCase();
  const row = await db
    .select()
    .from(admins)
    .where(eq(admins.username, u))
    .get();
  if (!row || !bcrypt.compareSync(password, row.passwordHash)) {
    return { ok: false, error: "Username atau password salah" };
  }
  const token = await signAdminToken(row.id, row.username);
  return { ok: true, token };
}
