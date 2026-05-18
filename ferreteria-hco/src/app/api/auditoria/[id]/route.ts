import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { getAuditLogById } from "@/server/queries/audit.queries";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  await requireAdmin();
  const log = await getAuditLogById(params.id);
  if (!log) {
    return NextResponse.json({ log: null }, { status: 404 });
  }
  return NextResponse.json({ log });
}
