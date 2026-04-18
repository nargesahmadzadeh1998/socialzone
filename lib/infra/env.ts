import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  NEXTAUTH_URL: z.string().url().optional(),
  APP_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(1),

  CRON_SHARED_SECRET: z.string().min(8),

  STORAGE_DRIVER: z.enum(["local"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("/data/uploads"),
});

type Env = z.infer<typeof schema>;

// Placeholder env when SKIP_ENV_VALIDATION=1 (used during `next build`).
const placeholder: Env = {
  DATABASE_URL: "postgresql://build:build@localhost:5432/build",
  NEXTAUTH_SECRET: "build-time-placeholder-secret-xx",
  NEXTAUTH_URL: undefined,
  APP_URL: "http://localhost",
  STRIPE_SECRET_KEY: "sk_build",
  STRIPE_WEBHOOK_SECRET: "whsec_build",
  RESEND_API_KEY: "re_build",
  RESEND_FROM: "Build <build@build.local>",
  CRON_SHARED_SECRET: "build-placeholder",
  STORAGE_DRIVER: "local",
  STORAGE_LOCAL_DIR: "/data/uploads",
};

export const env: Env =
  process.env.SKIP_ENV_VALIDATION === "1" ? placeholder : schema.parse(process.env);
