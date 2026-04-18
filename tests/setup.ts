import { config } from "dotenv";

config({ path: ".env.test" });
config({ path: ".env", override: false });

// Required env defaults for tests that don't hit these systems.
process.env.NEXTAUTH_SECRET ??= "test-secret-test-secret-test-secret";
process.env.APP_URL ??= "http://localhost";
process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder";
process.env.STRIPE_WEBHOOK_SECRET ??= "whsec_placeholder";
process.env.RESEND_API_KEY ??= "re_placeholder";
process.env.RESEND_FROM ??= "Test <test@test.local>";
process.env.CRON_SHARED_SECRET ??= "test-cron-secret";
process.env.STORAGE_LOCAL_DIR ??= "/tmp/socialzone-uploads";
