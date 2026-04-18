import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { hostDashboard } from "@/lib/domains/events";
import { formatDate, formatMoney } from "@/lib/utils";
import { ForbiddenError, NotFoundError } from "@/lib/infra/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HostEventDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { id } = await params;

  let data;
  try {
    data = await hostDashboard(session.user.id, id);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof ForbiddenError) redirect("/host/events");
    throw e;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/host/events" className="text-sm underline">← Back</Link>
        <h1 className="mt-2 text-2xl font-semibold">{data.event.title}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(data.event.startsAt, data.event.timezone)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Attendees</CardTitle></CardHeader>
          <CardContent><p className="text-3xl">{data.attendeeCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
          <CardContent><p className="text-3xl">{data.event.capacity}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl">{formatMoney(data.revenueMinor)}</p></CardContent>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Registered attendees</h2>
        {data.attendees.length === 0 && (
          <p className="text-sm text-muted-foreground">No registrations yet.</p>
        )}
        <ul className="divide-y rounded-md border">
          {data.attendees.map((r) => (
            <li key={r.id} className="flex items-center justify-between p-3 text-sm">
              <span>{r.user.displayName}</span>
              <span className="text-muted-foreground">{r.user.email}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
