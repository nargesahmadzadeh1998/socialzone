import type { ReactElement } from "react";
import { sendEmail } from "@/lib/infra/email";

export type NotificationPayload =
  | { kind: "email"; to: string; subject: string; react: ReactElement }
  | { kind: "sms"; to: string; body: string }
  | { kind: "push"; to: string; title: string; body: string };

export interface Notifier {
  send(payload: NotificationPayload): Promise<void>;
}

export class EmailNotifier implements Notifier {
  async send(payload: NotificationPayload): Promise<void> {
    if (payload.kind !== "email") return;
    await sendEmail({ to: payload.to, subject: payload.subject, react: payload.react });
  }
}

export class SmsNotifier implements Notifier {
  async send(payload: NotificationPayload): Promise<void> {
    if (payload.kind !== "sms") return;
    console.log(`[SmsNotifier stub] -> ${payload.to}: ${payload.body}`);
  }
}

export class PushNotifier implements Notifier {
  async send(payload: NotificationPayload): Promise<void> {
    if (payload.kind !== "push") return;
    console.log(`[PushNotifier stub] -> ${payload.to}: ${payload.title}`);
  }
}
