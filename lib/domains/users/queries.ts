import { prisma } from "@/lib/infra/db";

export async function listInterests() {
  return prisma.interest.findMany({ orderBy: { label: "asc" } });
}
