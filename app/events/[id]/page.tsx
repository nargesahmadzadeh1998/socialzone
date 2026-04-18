import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getEventDetail } from "@/lib/domains/events";
import { prisma } from "@/lib/infra/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";
import { registerAction } from "./actions";
import { ReviewForm } from "./review-form";
import { NotFoundError } from "@/lib/infra/errors";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let ev;
  try {
    ev = await getEventDetail(id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const session = await auth();
  const userId = session?.user?.id;

  const myReg = userId
    ? await prisma.registration.findUnique({
        where: { userId_eventId: { userId, eventId: id } },
      })
    : null;

  const myReview = userId
    ? await prisma.review.findUnique({
        where: { userId_eventId: { userId, eventId: id } },
      })
    : null;

  const remaining = ev.capacity - ev._count.registrations;
  const past = ev.startsAt <= new Date();

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <article className="space-y-4">
        <h1 className="text-3xl font-bold">{ev.title}</h1>
        <p className="text-sm text-muted-foreground">
          Hosted by {ev.host.displayName} · {ev.addressText}
        </p>
        <p className="text-sm">
          {formatDate(ev.startsAt, ev.timezone)} ({ev.timezone})
        </p>
        <div className="flex flex-wrap gap-2">
          {ev.interests.map((ei) => (
            <span key={ei.interestId} className="rounded-full bg-muted px-3 py-1 text-xs">
              {ei.interest.label}
            </span>
          ))}
        </div>
        <p className="whitespace-pre-wrap">{ev.description}</p>

        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">Reviews</h2>
          {ev.reviews.length === 0 && (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          )}
          <ul className="space-y-3">
            {ev.reviews.map((r) => (
              <li key={r.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {"★".repeat(r.stars)}
                  <span className="text-muted-foreground">{"★".repeat(5 - r.stars)}</span> · {r.user.displayName}
                </p>
                <p className="mt-1 text-sm">{r.text}</p>
              </li>
            ))}
          </ul>

          {past && userId && myReg?.status === "PAID" && !myReview && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Leave a review</h3>
              <ReviewForm eventId={ev.id} />
            </div>
          )}
        </section>
      </article>

      <aside>
        <Card>
          <CardHeader>
            <CardTitle>{ev.priceMinor === 0 ? "Free" : formatMoney(ev.priceMinor)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {remaining > 0 ? `${remaining} spot${remaining === 1 ? "" : "s"} left` : "Sold out"}
            </p>
            {ev.cancelledAt ? (
              <p className="text-sm text-destructive">This event was cancelled.</p>
            ) : myReg?.status === "PAID" ? (
              <p className="text-sm text-green-700">You're registered.</p>
            ) : past ? (
              <p className="text-sm text-muted-foreground">Event has passed.</p>
            ) : userId ? (
              <form action={registerAction}>
                <input type="hidden" name="eventId" value={ev.id} />
                <Button type="submit" disabled={remaining <= 0}>
                  {remaining <= 0 ? "Sold out" : ev.priceMinor === 0 ? "Register (free)" : "Register & pay"}
                </Button>
              </form>
            ) : (
              <Button asChild>
                <Link href={`/login`}>Log in to register</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
