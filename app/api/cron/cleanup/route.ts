import { NextResponse } from "next/server";
import { cleanupExpiredPending } from "@/lib/domains/registrations";
import { requireCronSecret } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (!requireCronSecret(req)) return new NextResponse("Forbidden", { status: 403 });
  const cancelled = await cleanupExpiredPending();
  return NextResponse.json({ cancelled });
}
