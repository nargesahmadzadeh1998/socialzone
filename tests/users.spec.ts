import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@/lib/infra/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/infra/db";
import { signup, verifyEmail } from "@/lib/domains/users";
import { resetDb } from "./helpers/db";

describe("signup + login + verify", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a user, issues a verification token, and verifies the email", async () => {
    const { userId } = await signup({
      email: "new@example.local",
      password: "sup3rsecret",
      displayName: "New Human",
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.emailVerifiedAt).toBeNull();

    const tok = await prisma.verificationToken.findFirstOrThrow({
      where: { identifier: "new@example.local" },
    });

    await verifyEmail(tok.token);

    const verified = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(verified.emailVerifiedAt).not.toBeNull();
  });

  it("logs in with the seeded password hash (bcrypt compare)", async () => {
    await signup({
      email: "login@example.local",
      password: "anothergood1",
      displayName: "Logger",
    });
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "login@example.local" },
    });
    expect(await bcrypt.compare("anothergood1", user.passwordHash)).toBe(true);
    expect(await bcrypt.compare("wrong", user.passwordHash)).toBe(false);
  });
});
