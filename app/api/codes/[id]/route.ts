import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-guard";
import { updateCodeStatus } from "@/lib/codes";
import type { AccessCodeStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

const statuses: AccessCodeStatus[] = ["active", "used", "inactive"];

type Ctx = { params: Promise<{ id: string }> } | { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  const params = await Promise.resolve(ctx.params);
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const st = body.status;
  if (!st || !statuses.includes(st as AccessCodeStatus)) {
    return NextResponse.json(
      { error: "status harus active | used | inactive" },
      { status: 400 }
    );
  }

  await updateCodeStatus(id, st as AccessCodeStatus);
  return NextResponse.json({ ok: true });
}
