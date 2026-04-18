import { prisma } from "@/lib/infra/db";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/infra/errors";

/**
 * Transactional capacity check + pending registration.
 * Called before redirecting to Stripe Checkout.
 */
export async function beginRegistration(userId: string, eventId: string): Promise<{
  registrationId: string;
  amountMinor: number;
  alreadyPaid: boolean;
}> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError();
    if (!user.emailVerifiedAt) throw new ForbiddenError("Email not verified");

    const ev = await tx.event.findUnique({ where: { id: eventId } });
    if (!ev) throw new NotFoundError();
    if (ev.cancelledAt) throw new ValidationError("Event cancelled");
    if (ev.startsAt <= new Date()) throw new ValidationError("Event has started");

    const existing = await tx.registration.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing?.status === "PAID") {
      return { registrationId: existing.id, amountMinor: existing.amountMinor, alreadyPaid: true };
    }

    const activeCount = await tx.registration.count({
      where: { eventId, status: { in: ["PAID", "PENDING"] } },
    });
    if (activeCount >= ev.capacity) throw new ConflictError("Event sold out");

    const reg = existing
      ? await tx.registration.update({
          where: { id: existing.id },
          data: { amountMinor: ev.priceMinor, status: "PENDING" },
        })
      : await tx.registration.create({
          data: { userId, eventId, amountMinor: ev.priceMinor, status: "PENDING" },
        });

    return { registrationId: reg.id, amountMinor: reg.amountMinor, alreadyPaid: false };
  });
}

export async function markPaidByCheckoutSession(
  checkoutSessionId: string,
  paymentIntentId: string | null,
): Promise<void> {
  const reg = await prisma.registration.findUnique({
    where: { stripeCheckoutSessionId: checkoutSessionId },
  });
  if (!reg) return;
  if (reg.status === "PAID") return;
  await prisma.registration.update({
    where: { id: reg.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntentId ?? reg.stripePaymentIntentId,
    },
  });
}

export async function attachCheckoutSession(
  registrationId: string,
  checkoutSessionId: string,
): Promise<void> {
  await prisma.registration.update({
    where: { id: registrationId },
    data: { stripeCheckoutSessionId: checkoutSessionId },
  });
}

export async function listMyRegistrations(userId: string) {
  const regs = await prisma.registration.findMany({
    where: { userId, status: "PAID" },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });
  const now = new Date();
  return {
    upcoming: regs.filter((r) => r.event.startsAt > now),
    past: regs.filter((r) => r.event.startsAt <= now),
  };
}

export async function cleanupExpiredPending(ttlMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000);
  const res = await prisma.registration.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "CANCELLED" },
  });
  return res.count;
}
