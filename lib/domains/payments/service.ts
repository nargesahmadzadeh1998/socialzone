import { prisma } from "@/lib/infra/db";
import { stripe } from "@/lib/infra/stripe";
import { env } from "@/lib/infra/env";
import { NotFoundError } from "@/lib/infra/errors";
import {
  attachCheckoutSession,
  beginRegistration,
  markPaidByCheckoutSession,
} from "../registrations";
import { sendRegistrationConfirmation } from "../notifications";

export async function startCheckout(
  userId: string,
  eventId: string,
): Promise<{ url: string; alreadyPaid: boolean }> {
  const { registrationId, alreadyPaid } = await beginRegistration(userId, eventId);
  if (alreadyPaid) {
    return { url: `${env.APP_URL}/events/${eventId}`, alreadyPaid: true };
  }

  const [user, ev] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.event.findUnique({ where: { id: eventId } }),
  ]);
  if (!user || !ev) throw new NotFoundError();

  // Zero-priced events: skip Stripe, mark as paid directly.
  if (ev.priceMinor === 0) {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "PAID", paidAt: new Date() },
    });
    await sendRegistrationConfirmation(user.email, user.displayName, ev.title, ev.startsAt);
    return { url: `${env.APP_URL}/me/events`, alreadyPaid: false };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: ev.priceMinor,
          product_data: { name: ev.title, description: ev.addressText },
        },
      },
    ],
    metadata: { registrationId, eventId, userId },
    success_url: `${env.APP_URL}/me/events?checkout=ok`,
    cancel_url: `${env.APP_URL}/events/${eventId}?checkout=cancel`,
  });

  await attachCheckoutSession(registrationId, session.id);
  return { url: session.url!, alreadyPaid: false };
}

export async function handleStripeEvent(rawBody: Buffer, signature: string): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const piId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;
    await markPaidByCheckoutSession(session.id, piId);

    const reg = await prisma.registration.findUnique({
      where: { stripeCheckoutSessionId: session.id },
      include: { user: true, event: true },
    });
    if (reg) {
      await sendRegistrationConfirmation(
        reg.user.email,
        reg.user.displayName,
        reg.event.title,
        reg.event.startsAt,
      );
    }
  }
}
