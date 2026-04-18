#!/bin/sh
set -eu

echo "[entrypoint] prisma migrate deploy"
npx --yes prisma migrate deploy --schema prisma/schema.prisma || {
  echo "[entrypoint] no migrations yet, running db push"
  npx --yes prisma db push --skip-generate --schema prisma/schema.prisma
}

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] seeding"
  npx --yes tsx prisma/seed.ts || true
fi

echo "[entrypoint] starting Next.js"
exec node server.js
