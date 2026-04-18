import { env } from "@/lib/infra/env";
import { timingSafeEqual } from "node:crypto";

export function requireCronSecret(req: Request): boolean {
  const header = req.headers.get("x-cron-secret");
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(env.CRON_SHARED_SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
