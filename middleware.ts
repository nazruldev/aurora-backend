import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getSessionSecretKey } from "./lib/session-secret";

const COOKIE = "access_admin_session";

/** Origin untuk CORS browser. Default `*` (semua domain). Set env `CORS_ORIGIN` ke URL spesifik jika perlu credentials. */
function corsOrigin(): string {
  const o = process.env.CORS_ORIGIN?.trim();
  return o && o.length > 0 ? o : "*";
}

function applyApiCors(res: NextResponse): NextResponse {
  const origin = corsOrigin();
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cookie"
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  if (origin !== "*") {
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      return applyApiCors(new NextResponse(null, { status: 204 }));
    }
    return applyApiCors(NextResponse.next());
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
