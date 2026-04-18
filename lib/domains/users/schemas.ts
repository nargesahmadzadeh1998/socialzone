import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(80),
  referredByCode: z.string().trim().max(32).optional().or(z.literal("")),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const profileSchema = z.object({
  displayName: z.string().min(1).max(80),
  bio: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  profession: z.string().max(80).optional().or(z.literal("")),
  interestIds: z.array(z.string().cuid()).max(20),
});
export type ProfileInput = z.infer<typeof profileSchema>;
