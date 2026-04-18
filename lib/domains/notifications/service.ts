import { prisma } from "@/lib/infra/db";
import { env } from "@/lib/infra/env";
import { EmailNotifier } from "./notifier";
import VerificationEmail from "@/emails/VerificationEmail";
import RegistrationConfirmationEmail from "@/emails/RegistrationConfirmationEmail";
import EventReminderEmail from "@/emails/EventReminderEmail";

const email = new EmailNotifier();

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const url = `${env.APP_URL}/verify?token=${encodeURIComponent(token)}`;
  await email.send({
    kind: "email",
    to,
    subject: "Verify your email",
    react: VerificationEmail({ name, url }),
  });
}

export async function sendRegistrationConfirmation(
  to: string,
  name: string,
  eventTitle: string,
  startsAt: Date,
): Promise<void> {
  await email.send({
    kind: "email",
    to,
    subject: `You're in: ${eventTitle}`,
    react: RegistrationConfirmationEmail({ name, eventTitle, startsAt }),
  });
}

/**
 * Day-of reminder: fetch all PAID registrations whose event starts in the
 * next 24h window, send reminder mail. Idempotency is best-effort via
 * cron cadence (run once per day); no reminder ledger in v1.
 */
export async function sendDayOfReminders(): Promise<number> {
  const start = new Date();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const regs = await prisma.registration.findMany({
    where: {
      status: "PAID",
      event: {
        startsAt: { gte: start, lt: end },
        cancelledAt: null,
      },
    },
    include: { user: true, event: true },
  });

  for (const r of regs) {
    await email.send({
      kind: "email",
      to: r.user.email,
      subject: `Reminder: ${r.event.title} is today`,
      react: EventReminderEmail({
        name: r.user.displayName,
        eventTitle: r.event.title,
        startsAt: r.event.startsAt,
        addressText: r.event.addressText,
      }),
    });
  }

  return regs.length;
}
