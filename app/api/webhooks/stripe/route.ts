import { NextResponse } from "next/server";
import { handleStripeEvent } from "@/lib/domains/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const raw = Buffer.from(await req.arrayBuffer());
  try {
    await handleStripeEvent(raw, sig);
    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid";
    return new NextResponse(`Webhook error: ${msg}`, { status: 400 });
  }
}
