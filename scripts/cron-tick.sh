#!/bin/bash
set -eu

: "${APP_INTERNAL_URL:=http://app:3000}"
: "${CRON_SHARED_SECRET:?CRON_SHARED_SECRET required}"
: "${REMINDER_INTERVAL_SECONDS:=3600}"
: "${CLEANUP_INTERVAL_SECONDS:=600}"

log() { echo "[cron] $(date -u +%FT%TZ) $*"; }

last_rem=0
last_clean=0

while true; do
  now=$(date +%s)
  if (( now - last_rem >= REMINDER_INTERVAL_SECONDS )); then
    log "hit /api/cron/reminders"
    curl -fsS -X POST -H "x-cron-secret: ${CRON_SHARED_SECRET}" \
      "${APP_INTERNAL_URL}/api/cron/reminders" || log "reminders failed"
    last_rem=$now
  fi
  if (( now - last_clean >= CLEANUP_INTERVAL_SECONDS )); then
    log "hit /api/cron/cleanup"
    curl -fsS -X POST -H "x-cron-secret: ${CRON_SHARED_SECRET}" \
      "${APP_INTERNAL_URL}/api/cron/cleanup" || log "cleanup failed"
    last_clean=$now
  fi
  sleep 30
done
