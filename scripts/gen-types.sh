#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE — add PROJECT_ID there."
  exit 1
fi

PROJECT_ID=$(grep '^PROJECT_ID=' "$ENV_FILE" | cut -d '=' -f2- | tr -d ' ')

if [ -z "$PROJECT_ID" ]; then
  echo "PROJECT_ID not found in $ENV_FILE"
  exit 1
fi

echo "Generating Supabase types..."
pnpx supabase gen types typescript --project-id "$PROJECT_ID" > src/types/database.ts

echo "Types generated successfully to src/types/database.ts"
