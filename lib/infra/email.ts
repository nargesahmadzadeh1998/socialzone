import { Resend } from "resend";
import { env } from "./env";
import type { ReactElement } from "react";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail(opts: {
  to: string;
  subject: string;
  react: ReactElement;
}): Promise<void> {
  await resend.emails.send({
    from: env.RESEND_FROM,
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
  });
}
