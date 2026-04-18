import { prisma } from "@/lib/infra/db";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/infra/errors";
import type { ReviewInput } from "./schemas";

export async function submitReview(userId: string, input: ReviewInput): Promise<string> {
  const ev = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!ev) throw new NotFoundError();
  if (ev.startsAt > new Date()) {
    throw new ValidationError("Reviews open after the event date");
  }

  const reg = await prisma.registration.findUnique({
    where: { userId_eventId: { userId, eventId: input.eventId } },
  });
  if (!reg || reg.status !== "PAID") {
    throw new ForbiddenError("Only paid attendees can review");
  }

  const existing = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId: input.eventId } },
  });
  if (existing) throw new ConflictError("Already reviewed");

  const review = await prisma.review.create({
    data: {
      userId,
      eventId: input.eventId,
      stars: input.stars,
      text: input.text,
    },
  });
  return review.id;
}
