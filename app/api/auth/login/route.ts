import { NextResponse } from "next/server";
import { loginAdmin, setSessionCookie } from "@/lib/auth";
import { ensureMigrated } from "@/lib/migrate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await ensureMigrated();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "DB error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return NextResponse.json(
      { error: "username dan password wajib" },
      { status: 400 }
    );
  }

  try {
    const r = await loginAdmin(username, password);
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: 401 });
    }
    await setSessionCookie(r.token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Login error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
