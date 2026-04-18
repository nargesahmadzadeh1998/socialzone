"use client";

import { useActionState } from "react";
import { reviewAction, type ReviewActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ReviewForm({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    reviewAction,
    undefined,
  );
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div>
        <Label htmlFor="stars">Stars (1–5)</Label>
        <select
          id="stars"
          name="stars"
          defaultValue="5"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="text">Review</Label>
        <Textarea id="text" name="text" required minLength={1} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-green-700">Thanks for the review.</p>}
      <Button type="submit" disabled={pending}>{pending ? "…" : "Submit"}</Button>
    </form>
  );
}
