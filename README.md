# Community Builder

A modular Next.js monolith for discovering and hosting real-world community events. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the system design.

## Quick start (≤5 commands)

```bash
cp .env.example .env
cd docker
docker compose up --build
# visit https://localhost (accept the self-signed cert)
# log in: alice@host.local / password123
```

That's four commands. On first run, migrations + seed run automatically (`SEED_ON_START=true` in `docker/compose.yml`). Flip to `false` after first boot.

### One-click deploy to Render (no CLI, no server)

1. Sign in to https://render.com (GitHub auth).
2. **New → Blueprint** → pick `nargesahmadzadeh1998/socialzone`, branch `claude/setup-community-builder-woh0W`.
3. Click **Apply**. Render reads `render.yaml` and provisions Postgres + web service + two cron jobs.

After first deploy, go to the web service's URL (looks like `https://socialzone-app.onrender.com`), and update `APP_URL` + `NEXTAUTH_URL` env vars to match the real URL (Render sometimes suffixes with a random string). One redeploy and you're live with TLS.

Free web plan spins down after 15 min idle; upgrade to Starter ($7/mo) for always-on + persistent disk for uploads.

### Public IP deployment (plain HTTP, port 8000)

On a VPS with no domain, use the `compose.public.yml` override — Caddy binds HTTP on port 8000 and skips TLS provisioning.

```bash
cp .env.example .env
# edit .env: set APP_URL and NEXTAUTH_URL to http://<your-public-ip>:8000
# (optional) change PUBLIC_PORT if 8000 is taken
cd docker
docker compose -f compose.yml -f compose.public.yml up --build -d
```

Open port 8000 in your firewall / cloud security group. For real use, point a domain at the host and revert to the default `compose.yml` so Caddy provisions a real certificate automatically.

## 5-minute walkthrough

1. **Home** → click **Create an account**. Use any email; with the seed you can log in as `user1@example.local` / `password123` instead.
2. **Profile** → pick 3+ interests. The ranked feed updates on save.
3. **Feed** → events sorted by how many of your interests overlap; tiebreaker is the soonest upcoming.
4. **Event detail** → click **Register & pay** on a priced event → redirects to Stripe Checkout (test card `4242 4242 4242 4242`) → returns to `/me/events` with a confirmation.
5. **Host** → **New event** → create an event you host. Seeded hosts: `alice@host.local`, `ben@host.local`, `carol@host.local`.
6. **Host dashboard** → see attendees + revenue for any event you host.
7. **Reviews** → seed includes two past events (AI Ethics Roundtable, Book Swap Brunch); if you're one of the seeded attendees on one of those, you can leave a review.
8. **Reminders** → trigger manually:
   ```bash
   docker compose exec app sh -c 'curl -fsS -X POST -H "x-cron-secret: $CRON_SHARED_SECRET" http://localhost:3000/api/cron/reminders'
   ```

## Configuration

All configuration is in `.env` (see `.env.example` for the full list). Keys required for a real deploy:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe (test mode works fine for v1).
- `RESEND_API_KEY`, `RESEND_FROM` — Resend. Emails will throw in dev without this; the test suite mocks it.
- `NEXTAUTH_SECRET` — generate with `openssl rand -hex 32`.
- `CRON_SHARED_SECRET` — any string ≥ 8 chars.

## Local development (no Docker)

```bash
npm install
docker run --rm -d --name sz-pg -p 5432:5432 \
  -e POSTGRES_USER=socialzone -e POSTGRES_PASSWORD=socialzone -e POSTGRES_DB=socialzone \
  postgres:16-alpine
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Tests

Integration tests expect a Postgres reachable at `DATABASE_URL`.

```bash
npm test
```

Covered:
- `tests/users.spec.ts` — signup issues verification token; `verifyEmail` flips `emailVerifiedAt`; bcrypt compare for login.
- `tests/webhook.spec.ts` — `checkout.session.completed` flips PENDING → PAID (Stripe client mocked).
- `tests/feed.spec.ts` — ranked feed ordering by overlap then soonest.
- `tests/review-guard.spec.ts` — future event rejected, no PAID reg rejected, past + PAID accepted.

Unit tests on trivial code are deliberately skipped.

## Deferred features (plug-in points)

| Feature | Status | Plugs in at |
|---|---|---|
| SMS notifications | Stub | `lib/domains/notifications/notifier.ts` — `SmsNotifier` |
| Push notifications | Stub | `lib/domains/notifications/notifier.ts` — `PushNotifier` |
| Groups | Interface only | `lib/domains/groups/index.ts` — `GroupRepository` |
| Broadcasts | Interface only | `lib/domains/broadcasts/index.ts` — `BroadcastService` |
| S3/R2 storage | Interface only | `lib/infra/storage.ts` — add an `S3Storage` class, flip `STORAGE_DRIVER` |
| Referral rewards | Captured, not rewarded | `User.referredByCode` is stored at signup |

## Known risks

See [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-known-risks--deliberate-punts). Highlights: no rate limiting, uploads volume not backed up, cron container is a SPOF.

## Directory layout

```
app/       Next.js routes: pages, server actions (*/actions.ts), route handlers (app/api/**)
lib/       Domain modules under lib/domains/* — cross-module access via each index.ts only
prisma/    schema.prisma, seed.ts
emails/    React Email templates
docker/    Dockerfile.app, Dockerfile.cron, Caddyfile, compose.yml
scripts/   entrypoint.sh (migrate + start), cron-tick.sh (poll loop)
tests/     Vitest integration tests
```
