import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { rankedFeed } from "@/lib/domains/events";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? 1));
  const rows = await rankedFeed(session.user.id, pageNum, 20);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Events for you</h1>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No upcoming events yet. Check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="transition hover:shadow">
                <CardHeader>
                  <CardTitle>{e.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {new Date(e.starts_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.overlap} matching interest{e.overlap === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6 flex justify-between">
        {pageNum > 1 ? (
          <Link href={`/feed?page=${pageNum - 1}`} className="text-sm underline">
            ← Previous
          </Link>
        ) : <span />}
        {rows.length === 20 && (
          <Link href={`/feed?page=${pageNum + 1}`} className="text-sm underline">
            Next →
          </Link>
        )}
      </div>
    </div>
  );
}
