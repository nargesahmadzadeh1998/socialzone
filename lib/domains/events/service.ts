import { prisma } from "@/lib/infra/db";
import { ForbiddenError, NotFoundError } from "@/lib/infra/errors";
import type { EventInput } from "./schemas";

export async function createEvent(hostId: string, input: EventInput): Promise<string> {
  const ev = await prisma.event.create({
    data: {
      hostId,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone,
      addressText: input.addressText,
      lat: input.lat ?? undefined,
      lng: input.lng ?? undefined,
      capacity: input.capacity,
      priceMinor: input.priceMinor,
      coverImagePath: input.coverImagePath ?? undefined,
      interests: {
        create: input.interestIds.map((interestId) => ({ interestId })),
      },
    },
  });
  return ev.id;
}

export async function updateEvent(
  actorId: string,
  eventId: string,
  input: EventInput,
): Promise<void> {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) throw new NotFoundError("Event not found");
  if (ev.hostId !== actorId) throw new ForbiddenError();

  await prisma.$transaction([
    prisma.event.update({
      where: { id: eventId },
      data: {
        title: input.title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        addressText: input.addressText,
        lat: input.lat ?? undefined,
        lng: input.lng ?? undefined,
        capacity: input.capacity,
        priceMinor: input.priceMinor,
        coverImagePath: input.coverImagePath ?? undefined,
      },
    }),
    prisma.eventInterest.deleteMany({ where: { eventId } }),
    prisma.eventInterest.createMany({
      data: input.interestIds.map((interestId) => ({ eventId, interestId })),
      skipDuplicates: true,
    }),
  ]);
}

export async function cancelEvent(actorId: string, eventId: string): Promise<void> {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) throw new NotFoundError();
  if (ev.hostId !== actorId) throw new ForbiddenError();
  await prisma.event.update({
    where: { id: eventId },
    data: { cancelledAt: new Date() },
  });
}

export async function getEventDetail(eventId: string) {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      host: { select: { id: true, displayName: true } },
      interests: { include: { interest: true } },
      reviews: {
        include: { user: { select: { displayName: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { registrations: { where: { status: { in: ["PAID", "PENDING"] } } } } },
    },
  });
  if (!ev) throw new NotFoundError();
  return ev;
}

export type FeedRow = {
  id: string;
  title: string;
  starts_at: Date;
  cover_image_path: string | null;
  overlap: number;
};

export async function rankedFeed(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<FeedRow[]> {
  const offset = (page - 1) * pageSize;
  // Single SQL query from ARCHITECTURE.md §7.
  return prisma.$queryRaw<FeedRow[]>`
    SELECT
      e.id,
      e.title,
      e."startsAt"       AS starts_at,
      e."coverImagePath" AS cover_image_path,
      COUNT(ui."interestId")::int AS overlap
    FROM "Event" e
    LEFT JOIN "EventInterest" ei ON ei."eventId" = e.id
    LEFT JOIN "UserInterest"  ui
      ON ui."interestId" = ei."interestId" AND ui."userId" = ${userId}
    WHERE e."startsAt" > NOW()
      AND e."cancelledAt" IS NULL
    GROUP BY e.id
    ORDER BY overlap DESC, e."startsAt" ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;
}

export async function hostDashboard(actorId: string, eventId: string) {
  const ev = await prisma.event.findUnique({ where: { id: eventId } });
  if (!ev) throw new NotFoundError();
  if (ev.hostId !== actorId) throw new ForbiddenError();
  const [paid, attendees] = await Promise.all([
    prisma.registration.findMany({
      where: { eventId, status: "PAID" },
      include: { user: { select: { id: true, displayName: true, email: true } } },
      orderBy: { paidAt: "asc" },
    }),
    prisma.registration.count({ where: { eventId, status: "PAID" } }),
  ]);
  const revenueMinor = paid.reduce((a, r) => a + r.amountMinor, 0);
  return { event: ev, attendees: paid, attendeeCount: attendees, revenueMinor };
}

export async function listHostEvents(hostId: string) {
  return prisma.event.findMany({
    where: { hostId },
    orderBy: { startsAt: "desc" },
    include: {
      _count: { select: { registrations: { where: { status: "PAID" } } } },
    },
  });
}
