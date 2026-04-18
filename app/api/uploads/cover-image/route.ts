import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storage } from "@/lib/infra/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return new NextResponse("No file", { status: 400 });
  if (!ALLOWED.has(file.type)) return new NextResponse("Unsupported type", { status: 415 });
  if (file.size > MAX_BYTES) return new NextResponse("Too large", { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const key = await storage().save(buf, file.name, file.type);
  return NextResponse.json({ key, url: storage().publicUrl(key) });
}
