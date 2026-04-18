import { prisma } from "@/lib/infra/db";

export async function resetDb(): Promise<void> {
  await prisma.review.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventInterest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.interest.deleteMany();
}
