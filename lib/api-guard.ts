import { NextResponse } from "next/server";
import { getSession } from "./auth";
import { ensureMigrated } from "./migrate";

export async function requireAdminSession() {
  await ensureMigrated();
  const session = await getSession();
  if (!session) {
    return {
      session: null as null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null as null };
}
