#!/usr/bin/env bash
# Daily PostgreSQL backup script for Workforce 360 ERP.
# Usage: ./scripts/backup-db.sh [output_dir]
# Requires: pg_dump, DATABASE_URL in environment or apps/api/.env

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${1:-$ROOT/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="workforce360_${TIMESTAMP}.sql.gz"

mkdir -p "$OUTPUT_DIR"

if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "$ROOT/apps/api/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/apps/api/.env"
    set +a
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Backing up to $OUTPUT_DIR/$FILENAME"
pg_dump "$DATABASE_URL" | gzip > "$OUTPUT_DIR/$FILENAME"
echo "Backup complete: $OUTPUT_DIR/$FILENAME"
