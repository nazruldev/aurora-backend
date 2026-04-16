import { NextResponse } from "next/server";
import { validateAndConsumeCode } from "@/lib/codes";
import { ensureMigrated } from "@/lib/migrate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await ensureMigrated();

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  if (!code.trim()) {
    return NextResponse.json({ error: "code wajib" }, { status: 400 });
  }

  const r = await validateAndConsumeCode(code);
  if (!r.valid) {
    return NextResponse.json({ valid: false, reason: r.reason });
  }
  return NextResponse.json({ valid: true, code: r.code });
}
