import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/feed");

  return (
    <div className="flex flex-col items-start gap-6 py-16">
      <h1 className="text-4xl font-bold">Find your people.</h1>
      <p className="max-w-xl text-muted-foreground">
        Community Builder helps you discover in-person events that match your
        interests, host your own, and stay close to a local scene.
      </p>
      <div className="flex gap-3">
        <Button asChild><Link href="/signup">Create an account</Link></Button>
        <Button asChild variant="outline"><Link href="/login">Log in</Link></Button>
      </div>
    </div>
  );
}
