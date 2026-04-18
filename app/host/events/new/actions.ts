"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthError, DomainError } from "@/lib/infra/errors";
import { createEvent, eventInputSchema } from "@/lib/domains/events";

export type CreateEventState = { error?: string } | undefined;

export async function createEventAction(
  _prev: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const parsed = eventInputSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    timezone: formData.get("timezone") || "UTC",
    addressText: formData.get("addressText"),
    lat: formData.get("lat") || null,
    lng: formData.get("lng") || null,
    capacity: formData.get("capacity"),
    priceMinor: formData.get("priceMinor"),
    interestIds: formData.getAll("interestIds"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const eventId = await createEvent(session.user.id, parsed.data);
    redirect(`/host/events/${eventId}`);
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    throw e;
  }
}
