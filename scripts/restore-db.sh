#!/usr/bin/env bash
# Restore a gzip-compressed PostgreSQL dump.
# Usage: ./scripts/restore-db.sh path/to/backup.sql.gz
# WARNING: drops and recreates the public schema.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT/apps/api/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/apps/api/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Restoring from $BACKUP_FILE (this will replace existing data)"
read -r -p "Continue? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted"
  exit 0
fi

gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "Restore complete"
