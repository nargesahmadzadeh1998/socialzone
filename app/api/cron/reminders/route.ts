import { NextResponse } from "next/server";
import { sendDayOfReminders } from "@/lib/domains/notifications";
import { requireCronSecret } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  if (!requireCronSecret(req)) return new NextResponse("Forbidden", { status: 403 });
  const count = await sendDayOfReminders();
  return NextResponse.json({ sent: count });
}
