import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listHostEvents } from "@/lib/domains/events";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function HostEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const events = await listHostEvents(session.user.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your events</h1>
        <Button asChild><Link href="/host/events/new">New event</Link></Button>
      </div>
      {events.length === 0 && <p className="text-muted-foreground">You haven't created any events yet.</p>}
      <ul className="space-y-2">
        {events.map((e) => (
          <li key={e.id} className="rounded-md border p-3">
            <Link href={`/host/events/${e.id}`} className="font-medium hover:underline">
              {e.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatDate(e.startsAt, e.timezone)} · {e._count.registrations} paid · {formatMoney(e.priceMinor)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
