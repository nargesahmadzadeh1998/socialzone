"use client";

import { useActionState } from "react";
import { createEventAction, type CreateEventState } from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Interest = { id: string; label: string };

export function NewEventForm({ interests }: { interests: Interest[] }) {
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(
    createEventAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required minLength={10} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startsAt">Starts at</Label>
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div>
          <Label htmlFor="endsAt">Ends at</Label>
          <Input id="endsAt" name="endsAt" type="datetime-local" required />
        </div>
      </div>
      <div>
        <Label htmlFor="timezone">Timezone (IANA)</Label>
        <Input id="timezone" name="timezone" defaultValue="America/Los_Angeles" required />
      </div>
      <div>
        <Label htmlFor="addressText">Address</Label>
        <Input id="addressText" name="addressText" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="capacity">Capacity</Label>
          <Input id="capacity" name="capacity" type="number" min={1} required />
        </div>
        <div>
          <Label htmlFor="priceMinor">Price (cents USD, 0 = free)</Label>
          <Input id="priceMinor" name="priceMinor" type="number" min={0} required />
        </div>
      </div>
      <div>
        <Label>Interests</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((i) => (
            <label key={i.id} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
              <input type="checkbox" name="interestIds" value={i.id} />
              {i.label}
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create event"}</Button>
    </form>
  );
}
