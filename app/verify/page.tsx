import { verifyEmail } from "@/lib/domains/users";
import { DomainError } from "@/lib/infra/errors";
import Link from "next/link";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return <p>Missing token.</p>;
  }
  try {
    await verifyEmail(token);
    return (
      <div className="mx-auto max-w-md py-8">
        <h1 className="mb-3 text-2xl font-semibold">Email verified</h1>
        <p className="text-muted-foreground">
          You can now <Link href="/login" className="underline">log in</Link>.
        </p>
      </div>
    );
  } catch (e) {
    const msg = e instanceof DomainError ? e.message : "Verification failed";
    return (
      <div className="mx-auto max-w-md py-8">
        <h1 className="mb-3 text-2xl font-semibold">Verification failed</h1>
        <p className="text-muted-foreground">{msg}</p>
      </div>
    );
  }
}
