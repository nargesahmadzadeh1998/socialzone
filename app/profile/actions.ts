"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { AuthError } from "@/lib/infra/errors";
import { profileSchema, updateProfile } from "@/lib/domains/users";

export type ProfileActionState = { ok?: boolean; error?: string } | undefined;

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new AuthError();

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") ?? "",
    city: formData.get("city") ?? "",
    profession: formData.get("profession") ?? "",
    interestIds: formData.getAll("interestIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await updateProfile(session.user.id, parsed.data);
  revalidatePath("/profile");
  revalidatePath("/feed");
  return { ok: true };
}
