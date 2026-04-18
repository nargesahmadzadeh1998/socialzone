import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/infra/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/infra/db";
import { rankedFeed } from "@/lib/domains/events";
import { resetDb } from "./helpers/db";

describe("ranked feed query", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("ranks events by interest overlap, then by soonest startsAt", async () => {
    const [ai, yoga, music] = await Promise.all([
      prisma.interest.create({ data: { slug: "ai", label: "AI" } }),
      prisma.interest.create({ data: { slug: "yoga", label: "Yoga" } }),
      prisma.interest.create({ data: { slug: "music", label: "Music" } }),
    ]);

    const host = await prisma.user.create({
      data: {
        email: "h@feed.local",
        passwordHash: await bcrypt.hash("pw", 4),
        displayName: "Host",
        referralCode: "FH",
        emailVerifiedAt: new Date(),
      },
    });
    const me = await prisma.user.create({
      data: {
        email: "me@feed.local",
        passwordHash: await bcrypt.hash("pw", 4),
        displayName: "Me",
        referralCode: "FM",
        emailVerifiedAt: new Date(),
        interests: { create: [{ interestId: ai.id }, { interestId: yoga.id }] },
      },
    });

    const mk = async (title: string, days: number, tagIds: string[]) =>
      prisma.event.create({
        data: {
          hostId: host.id,
          title,
          description: "x",
          startsAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          timezone: "UTC",
          addressText: "a",
          capacity: 10,
          priceMinor: 0,
          interests: { create: tagIds.map((interestId) => ({ interestId })) },
        },
      });

    const both = await mk("Both (overlap 2)", 5, [ai.id, yoga.id]);
    const ai1 = await mk("AI only, earlier (overlap 1)", 2, [ai.id]);
    const ai2 = await mk("AI only, later (overlap 1)", 7, [ai.id]);
    const none = await mk("Music only (overlap 0)", 1, [music.id]);

    const rows = await rankedFeed(me.id, 1, 20);
    const order = rows.map((r) => r.id);
    expect(order).toEqual([both.id, ai1.id, ai2.id, none.id]);

    const byId = new Map(rows.map((r) => [r.id, r.overlap]));
    expect(byId.get(both.id)).toBe(2);
    expect(byId.get(ai1.id)).toBe(1);
    expect(byId.get(none.id)).toBe(0);
  });
});
