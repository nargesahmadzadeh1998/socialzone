import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-muted-foreground">
        That page doesn't exist. <Link href="/" className="underline">Go home</Link>.
      </p>
    </div>
  );
}
