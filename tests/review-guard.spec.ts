import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/infra/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/infra/db";
import { submitReview } from "@/lib/domains/reviews";
import { ForbiddenError, ValidationError } from "@/lib/infra/errors";
import { resetDb } from "./helpers/db";

async function seedPair() {
  const host = await prisma.user.create({
    data: {
      email: "h@rev.local",
      passwordHash: await bcrypt.hash("pw", 4),
      displayName: "H",
      referralCode: "RH",
      emailVerifiedAt: new Date(),
    },
  });
  const user = await prisma.user.create({
    data: {
      email: "u@rev.local",
      passwordHash: await bcrypt.hash("pw", 4),
      displayName: "U",
      referralCode: "RU",
      emailVerifiedAt: new Date(),
    },
  });
  return { host, user };
}

async function mkEvent(hostId: string, startsAt: Date) {
  return prisma.event.create({
    data: {
      hostId,
      title: "Event",
      description: "x",
      startsAt,
      endsAt: new Date(startsAt.getTime() + 60 * 60 * 1000),
      timezone: "UTC",
      addressText: "a",
      capacity: 10,
      priceMinor: 0,
    },
  });
}

describe("review-after-event-date guard", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("rejects when event is in the future", async () => {
    const { host, user } = await seedPair();
    const ev = await mkEvent(host.id, new Date(Date.now() + 24 * 60 * 60 * 1000));
    await prisma.registration.create({
      data: { userId: user.id, eventId: ev.id, amountMinor: 0, status: "PAID", paidAt: new Date() },
    });
    await expect(submitReview(user.id, { eventId: ev.id, stars: 5, text: "great" }))
      .rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects when user has no PAID registration", async () => {
    const { host, user } = await seedPair();
    const ev = await mkEvent(host.id, new Date(Date.now() - 24 * 60 * 60 * 1000));
    await expect(submitReview(user.id, { eventId: ev.id, stars: 5, text: "great" }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  it("accepts when event is past and registration is PAID", async () => {
    const { host, user } = await seedPair();
    const ev = await mkEvent(host.id, new Date(Date.now() - 24 * 60 * 60 * 1000));
    await prisma.registration.create({
      data: { userId: user.id, eventId: ev.id, amountMinor: 0, status: "PAID", paidAt: new Date() },
    });
    const id = await submitReview(user.id, { eventId: ev.id, stars: 5, text: "great" });
    expect(id).toBeTruthy();
  });
});
