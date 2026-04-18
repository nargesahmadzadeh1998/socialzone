export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="mb-3 text-2xl font-semibold">Check your email</h1>
      <p className="text-muted-foreground">
        We sent a verification link to {sp.email}. Click it to finish signup.
      </p>
    </div>
  );
}
