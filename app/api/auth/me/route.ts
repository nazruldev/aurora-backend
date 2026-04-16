import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureMigrated } from "@/lib/migrate";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureMigrated();
  const s = await getSession();
  if (!s) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: s.sub, username: s.username } });
}
