import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listInterests } from "@/lib/domains/users";
import { NewEventForm } from "./new-event-form";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const interests = await listInterests();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">New event</h1>
      <NewEventForm interests={interests} />
    </div>
  );
}
