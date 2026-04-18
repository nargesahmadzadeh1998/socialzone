import { SignupForm } from "./signup-form";

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create an account</h1>
      <SignupFormWrapper searchParams={searchParams} />
    </div>
  );
}

async function SignupFormWrapper({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const sp = await searchParams;
  return <SignupForm initialRef={sp.ref ?? ""} />;
}
