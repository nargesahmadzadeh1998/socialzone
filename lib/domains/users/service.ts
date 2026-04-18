import { prisma } from "@/lib/infra/db";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/infra/errors";
import type { SignupInput, ProfileInput } from "./schemas";
import { sendVerificationEmail } from "../notifications";

function code(bytes = 4): string {
  return randomBytes(bytes).toString("hex").toUpperCase();
}

export async function signup(input: SignupInput): Promise<{ userId: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      referralCode: code(),
      referredByCode: input.referredByCode && input.referredByCode.length > 0
        ? input.referredByCode
        : undefined,
    },
  });

  const token = randomBytes(24).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      purpose: "EMAIL_VERIFY",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(user.email, user.displayName, token);

  return { userId: user.id };
}

export async function verifyEmail(token: string): Promise<void> {
  const row = await prisma.verificationToken.findUnique({ where: { token } });
  if (!row) throw new NotFoundError("Invalid token");
  if (row.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    throw new ValidationError("Token expired");
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { email: row.identifier },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        bio: input.bio || null,
        city: input.city || null,
        profession: input.profession || null,
      },
    }),
    prisma.userInterest.deleteMany({ where: { userId } }),
    prisma.userInterest.createMany({
      data: input.interestIds.map((interestId) => ({ userId, interestId })),
      skipDuplicates: true,
    }),
  ]);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { interests: { include: { interest: true } } },
  });
  if (!user) throw new NotFoundError("User not found");
  return user;
}
