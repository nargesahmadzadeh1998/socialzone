"use server";

import { redirect } from "next/navigation";
import { signupSchema, signup } from "@/lib/domains/users";
import { DomainError } from "@/lib/infra/errors";

export type SignupActionState = { error?: string } | undefined;

export async function signupAction(
  _prev: SignupActionState,
  formData: FormData,
): Promise<SignupActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    referredByCode: formData.get("referredByCode") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await signup(parsed.data);
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    throw e;
  }

  redirect(`/signup/check-email?email=${encodeURIComponent(parsed.data.email)}`);
}
