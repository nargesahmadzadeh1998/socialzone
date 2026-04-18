import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/infra/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/infra/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: (_raw: Buffer, _sig: string, _secret: string) => ({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_abc",
            payment_intent: "pi_test_abc",
          },
        },
      }),
    },
    checkout: { sessions: { create: vi.fn() } },
  },
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/infra/db";
import { handleStripeEvent } from "@/lib/domains/payments";
import { resetDb } from "./helpers/db";

describe("Stripe webhook -> registration PAID", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("flips the registration to PAID when a checkout.session.completed event arrives", async () => {
    const interest = await prisma.interest.create({ data: { slug: "tests", label: "Tests" } });
    const host = await prisma.user.create({
      data: {
        email: "h@t.local",
        passwordHash: await bcrypt.hash("pw", 4),
        displayName: "Host",
        referralCode: "HREF",
        emailVerifiedAt: new Date(),
      },
    });
    const user = await prisma.user.create({
      data: {
        email: "u@t.local",
        passwordHash: await bcrypt.hash("pw", 4),
        displayName: "User",
        referralCode: "UREF",
        emailVerifiedAt: new Date(),
      },
    });
    const ev = await prisma.event.create({
      data: {
        hostId: host.id,
        title: "Webhook Test",
        description: "x",
        startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 26),
        timezone: "UTC",
        addressText: "somewhere",
        capacity: 10,
        priceMinor: 1000,
        interests: { create: [{ interestId: interest.id }] },
      },
    });
    const reg = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId: ev.id,
        amountMinor: 1000,
        status: "PENDING",
        stripeCheckoutSessionId: "cs_test_abc",
      },
    });

    await handleStripeEvent(Buffer.from("{}"), "sig");

    const after = await prisma.registration.findUniqueOrThrow({ where: { id: reg.id } });
    expect(after.status).toBe("PAID");
    expect(after.stripePaymentIntentId).toBe("pi_test_abc");
    expect(after.paidAt).not.toBeNull();
  });
});
