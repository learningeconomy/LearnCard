#!/usr/bin/env bash
# ============================================================================
# backup-env.sh — Backup the current .env files before regeneration
# ============================================================================
# Copies the current service .env files to .env.backup so you can restore them
# if an Infisical pull needs to be rolled back.
#
# Usage:
#   pnpm env:backup
# ============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_FILES=(
  "services/learn-card-network/brain-service/.env"
  "services/learn-card-network/learn-cloud-service/.env"
  "apps/learn-card-app/.env"
  "services/learn-card-network/lca-api/.env"
  "services/learn-card-network/simple-signing-service/.env"
)

echo "Backing up current .env files..."
echo ""

backed_up=0
skipped=0

for rel_path in "${ENV_FILES[@]}"; do
  source_file="${REPO_ROOT}/${rel_path}"
  backup_file="${source_file}.backup"

  if [[ -f "$source_file" ]]; then
    cp "$source_file" "$backup_file"
    echo "  ✔ ${rel_path} -> ${rel_path}.backup"
    backed_up=$((backed_up + 1))
  else
    echo "  ⚠ ${rel_path} not found — skipped" >&2
    skipped=$((skipped + 1))
  fi
 done

echo ""
echo "Done. Backed up ${backed_up} file(s); skipped ${skipped}."
