import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/api-guard";
import { listCodes } from "@/lib/codes";
import type { AccessCodeStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

const statuses: AccessCodeStatus[] = ["active", "used", "inactive"];

function parseStatus(v: string | null): AccessCodeStatus | undefined {
  if (!v) return undefined;
  return statuses.includes(v as AccessCodeStatus)
    ? (v as AccessCodeStatus)
    : undefined;
}

export async function GET(req: Request) {
  const guard = await requireAdminSession();
  if (guard.error) return guard.error;

  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));
  const batchId = searchParams.get("batchId")?.trim() || undefined;

  const rows = await listCodes({ status, batchId });
  return NextResponse.json({ items: rows });
}
