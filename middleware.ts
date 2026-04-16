import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecretKey } from "./lib/session-secret";

const COOKIE = "access_admin_session";

const DEFAULT_ALLOW_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "origin",
  "referer",
  "x-requested-with",
  "cookie",
  "cache-control",
  "pragma",
  "user-agent",
].join(", ");

/**
 * - `CORS_ORIGIN` (satu nilai) menang mutlak.
 * - `CORS_ORIGINS` (pisah koma): hanya origin yang cocok (mis. Gemini + domain kamu).
 * - Tanpa keduanya: **mirror** `Origin` (termasuk literal `null` untuk sandbox).
 * Kembalikan `""` = origin tidak diizinkan (tanpa header CORS).
 */
function corsAllowOrigin(req: NextRequest): string {
  const fixed = process.env.CORS_ORIGIN?.trim();
  if (fixed) return fixed;

  const rawList = process.env.CORS_ORIGINS?.trim();
  const list = rawList
    ? rawList.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const og = req.headers.get("origin");

  if (list && list.length > 0) {
    if (!og) return "*";
    if (list.includes(og)) return og;
    return "";
  }

  if (og === "null") return "null";
  if (og && og.length > 0) return og;
  return "*";
}

function applyApiCors(req: NextRequest, res: NextResponse): NextResponse {
  const allowOrigin = corsAllowOrigin(req);
  if (allowOrigin === "") {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.next();
  }

  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Vary", "Origin");

  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  const requested = req.headers.get("access-control-request-headers");
  res.headers.set(
    "Access-Control-Allow-Headers",
    requested && requested.trim().length > 0 ? requested : DEFAULT_ALLOW_HEADERS
  );

  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set(
    "Access-Control-Expose-Headers",
    "Content-Type, Content-Length"
  );

  if (allowOrigin !== "*") {
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      return applyApiCors(req, new NextResponse(null, { status: 204 }));
    }
    return applyApiCors(req, NextResponse.next());
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, getSessionSecretKey());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/:path*"],
};
