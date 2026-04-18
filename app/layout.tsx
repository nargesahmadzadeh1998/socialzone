import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Community Builder",
  description: "Find and host real-world community events.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/30">
        <header className="border-b bg-background">
          <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/" className="font-semibold">Community Builder</Link>
            <div className="flex items-center gap-3 text-sm">
              {session?.user ? (
                <>
                  <Link href="/feed" className="hover:underline">Feed</Link>
                  <Link href="/me/events" className="hover:underline">My events</Link>
                  <Link href="/host/events" className="hover:underline">Host</Link>
                  <Link href="/profile" className="hover:underline">Profile</Link>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <Button type="submit" variant="ghost" size="sm">Sign out</Button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:underline">Log in</Link>
                  <Link href="/signup" className="hover:underline">Sign up</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
