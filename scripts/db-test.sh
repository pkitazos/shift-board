#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — add DATABASE_URL there."
  exit 1
fi

DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2-)

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not found in $ENV_FILE"
  exit 1
fi

echo "Running pgTAP tests..."
psql "$DATABASE_URL" -f supabase/tests/rls_policies.test.sql
