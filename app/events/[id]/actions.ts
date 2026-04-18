"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthError, DomainError } from "@/lib/infra/errors";
import { startCheckout } from "@/lib/domains/payments";
import { reviewSchema, submitReview } from "@/lib/domains/reviews";
import { revalidatePath } from "next/cache";

export async function registerAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();
  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return;

  const { url } = await startCheckout(session.user.id, eventId);
  redirect(url);
}

export type ReviewActionState = { ok?: boolean; error?: string } | undefined;

export async function reviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const parsed = reviewSchema.safeParse({
    eventId: formData.get("eventId"),
    stars: formData.get("stars"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    await submitReview(session.user.id, parsed.data);
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/events/${parsed.data.eventId}`);
  return { ok: true };
}
