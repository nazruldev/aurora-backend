import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-guard";
import { generateCodes } from "@/lib/codes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  let body: {
    count?: number;
    note?: string;
    expiresAt?: string | null;
    batchId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const count =
    typeof body.count === "number" && Number.isFinite(body.count)
      ? body.count
      : 1;

  try {
    const out = await generateCodes({
      count,
      note: body.note,
      expiresAt: body.expiresAt ?? undefined,
      batchId: body.batchId ?? undefined,
    });
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generate failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
