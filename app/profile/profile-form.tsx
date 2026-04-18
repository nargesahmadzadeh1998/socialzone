"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileActionState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Interest = { id: string; label: string };

export function ProfileForm({
  initial,
  interests,
}: {
  initial: {
    displayName: string;
    bio: string;
    city: string;
    profession: string;
    interestIds: string[];
  };
  interests: Interest[];
}) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    undefined,
  );
  const picked = new Set(initial.interestIds);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={initial.displayName} required />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initial.bio} />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={initial.city} />
      </div>
      <div>
        <Label htmlFor="profession">Profession</Label>
        <Input id="profession" name="profession" defaultValue={initial.profession} />
      </div>
      <div>
        <Label>Interests</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((i) => (
            <label
              key={i.id}
              className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
            >
              <input
                type="checkbox"
                name="interestIds"
                value={i.id}
                defaultChecked={picked.has(i.id)}
              />
              {i.label}
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Saved.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
    </form>
  );
}
