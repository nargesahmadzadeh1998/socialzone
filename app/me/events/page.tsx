import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listMyRegistrations } from "@/lib/domains/registrations";
import { formatDate } from "@/lib/utils";

export default async function MyEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { upcoming, past } = await listMyRegistrations(session.user.id);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-xl font-semibold">Upcoming</h2>
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing booked.</p>}
        <ul className="space-y-2">
          {upcoming.map((r) => (
            <li key={r.id} className="rounded-md border p-3">
              <Link href={`/events/${r.eventId}`} className="font-medium hover:underline">
                {r.event.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDate(r.event.startsAt, r.event.timezone)}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Past</h2>
        {past.length === 0 && <p className="text-sm text-muted-foreground">No past events.</p>}
        <ul className="space-y-2">
          {past.map((r) => (
            <li key={r.id} className="rounded-md border p-3">
              <Link href={`/events/${r.eventId}`} className="font-medium hover:underline">
                {r.event.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                {formatDate(r.event.startsAt, r.event.timezone)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
