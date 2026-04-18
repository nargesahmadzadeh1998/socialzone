import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfile, listInterests } from "@/lib/domains/users";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, interests] = await Promise.all([
    getProfile(session.user.id),
    listInterests(),
  ]);

  const selected = new Set(user.interests.map((ui) => ui.interestId));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Your profile</h1>
      {!user.emailVerifiedAt && (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          Your email is not verified. Check your inbox for a verification link.
        </p>
      )}
      <ProfileForm
        initial={{
          displayName: user.displayName,
          bio: user.bio ?? "",
          city: user.city ?? "",
          profession: user.profession ?? "",
          interestIds: [...selected],
        }}
        interests={interests}
      />
    </div>
  );
}
