"use client";

import { useActionState } from "react";
import { signupAction, type SignupActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SignupForm({ initialRef }: { initialRef: string }) {
  const [state, formAction, pending] = useActionState<SignupActionState, FormData>(
    signupAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" required minLength={1} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>
      <div>
        <Label htmlFor="referredByCode">Referral code (optional)</Label>
        <Input id="referredByCode" name="referredByCode" defaultValue={initialRef} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Sign up"}</Button>
    </form>
  );
}
