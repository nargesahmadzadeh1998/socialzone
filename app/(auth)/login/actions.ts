"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/feed",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: e.type === "CredentialsSignin" ? "Invalid email or password" : "Auth failed" };
    }
    throw e;
  }
}
