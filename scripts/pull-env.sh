#!/usr/bin/env bash
# ==============================================================================
# pull-env.sh — Generate .env files from Infisical
# ==============================================================================
# Pulls secrets from the Infisical "LearnCard" project and writes them to the
# correct .env files throughout the monorepo.
#
# Prerequisites:
#   1. Install the Infisical CLI: https://infisical.com/docs/cli/overview
#   2. Log in:  infisical login
#   3. Run `infisical init` in the repo root (creates .infisical.json with the
#      LearnCard project ID), OR pass --projectId=<id> to this script.
#
# Usage:
#   pnpm env:pull                      # Pull dev env for all services
#   pnpm env:pull -- --env=staging     # Pull staging env for all services
#   pnpm env:pull -- --only=brain      # Pull dev env for brain-service only
#   pnpm env:pull -- --list            # Show available service targets
#
# Infisical folder structure (LearnCard project):
#   /                              → root-level shared vars
#   /LearnCard/brain-service       → brain-service secrets
#   /LearnCard/cloud-service       → learn-cloud-service secrets
#   /learn-card-app                → learn-card-app secrets
#   /learn-card-app/lca-api        → lca-api secrets
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# Configuration: mapping of service key → (infisical_path, local_env_file)
#
# Each entry can specify multiple Infisical paths separated by "|". Secrets
# from all listed paths are merged into one .env file (later paths win on
# conflicts). Use this when a service needs root-level vars combined with its
# own folder.
#
# To add a new service, add an entry to ALL three arrays below.
# ---------------------------------------------------------------------------

SERVICE_KEYS=(
  brain
  cloud
  app
  lca-api
  signing
)

# Infisical folder paths — use "|" to merge multiple paths into one .env.
# Paths are exported in order; later paths overwrite earlier keys.
INFISICAL_PATHS=(
  "/|/LearnCard/brain-service"                  # brain
  "/|/LearnCard/cloud-service"                  # cloud
  "/|/learn-card-app"                           # app
  "/|/learn-card-app/lca-api"                   # lca-api
  "/"                                           # signing (root only for now)
)

# Local .env file paths (relative to repo root)
LOCAL_ENV_FILES=(
  "services/learn-card-network/brain-service/.env"          # brain
  "services/learn-card-network/learn-cloud-service/.env"    # cloud
  "apps/learn-card-app/.env"                                # app
  "services/learn-card-network/lca-api/.env"                # lca-api
  "services/learn-card-network/simple-signing-service/.env" # signing
)

# Human-readable labels for --list output
SERVICE_LABELS=(
  "Brain Service"
  "LearnCloud Service"
  "LearnCard App"
  "LCA API"
  "Simple Signing Service"
)

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
ENV_SLUG="dev"
ONLY=""
PROJECT_ID_FLAG=""
LIST_MODE=false

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --env=*)      ENV_SLUG="${arg#*=}" ;;
    --only=*)     ONLY="${arg#*=}" ;;
    --projectId=*) PROJECT_ID_FLAG="--projectId=${arg#*=}" ;;
    --list)       LIST_MODE=true ;;
    --help|-h)
      sed -n '2,/^# ====/p' "$0" | head -n -1 | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# --list: print available targets and exit
# ---------------------------------------------------------------------------
if $LIST_MODE; then
  echo "Available service targets (use with --only=<key>):"
  echo ""
  for i in "${!SERVICE_KEYS[@]}"; do
    printf "  %-12s → %s\n" "${SERVICE_KEYS[$i]}" "${SERVICE_LABELS[$i]}"
    printf "  %-12s   Infisical: %s\n" "" "${INFISICAL_PATHS[$i]}"
    printf "  %-12s   Local:     %s\n" "" "${LOCAL_ENV_FILES[$i]}"
    echo ""
  done
  exit 0
fi

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
if ! command -v infisical &>/dev/null; then
  echo "Error: 'infisical' CLI not found." >&2
  echo "Install it: https://infisical.com/docs/cli/overview" >&2
  exit 1
fi

echo "Pulling secrets from Infisical (env=${ENV_SLUG})..."
echo ""

# ---------------------------------------------------------------------------
# Export helper — pulls one Infisical path to stdout in dotenv format
# ---------------------------------------------------------------------------
export_path() {
  local path="$1"
  # shellcheck disable=SC2086
  infisical export \
    --env="$ENV_SLUG" \
    --path="$path" \
    --format=dotenv \
    --include-imports \
    $PROJECT_ID_FLAG 2>/dev/null
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
pulled=0
skipped=0

for i in "${!SERVICE_KEYS[@]}"; do
  key="${SERVICE_KEYS[$i]}"
  label="${SERVICE_LABELS[$i]}"
  paths_str="${INFISICAL_PATHS[$i]}"
  env_file="${REPO_ROOT}/${LOCAL_ENV_FILES[$i]}"

  # Filter by --only if set
  if [[ -n "$ONLY" && "$key" != "$ONLY" ]]; then
    continue
  fi

  echo "  ▸ ${label} (${key})"

  # Split paths on "|"
  IFS='|' read -ra paths <<< "$paths_str"

  # Create a temp file to accumulate secrets
  tmp="$(mktemp)"
  trap "rm -f '$tmp'" EXIT

  for p in "${paths[@]}"; do
    echo "    pulling from ${p} ..."
    if ! export_path "$p" >> "$tmp" 2>/dev/null; then
      echo "    ⚠  Warning: failed to export path '${p}' — skipping" >&2
    fi
  done

  # Deduplicate: if the same KEY appears multiple times, keep the last value.
  # This ensures later paths (more specific) override earlier ones (root).
  if [[ -s "$tmp" ]]; then
    # Use awk to keep last occurrence of each key
    awk -F= '
      /^#/ { next }
      /^[[:space:]]*$/ { next }
      {
        key = $1
        sub(/^[^=]*=/, "")
        vals[key] = $0
        if (!(key in order)) { keys[++n] = key; order[key] = 1 }
      }
      END {
        for (i = 1; i <= n; i++) print keys[i] "=" vals[keys[i]]
      }
    ' "$tmp" > "${tmp}.deduped"

    # Ensure parent directory exists
    mkdir -p "$(dirname "$env_file")"

    # Write header + secrets
    {
      echo "# Auto-generated by pull-env.sh from Infisical (env=${ENV_SLUG})"
      echo "# $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
      echo "# Do not edit manually — changes will be overwritten on next pull."
      echo ""
      cat "${tmp}.deduped"
    } > "$env_file"

    rm -f "${tmp}" "${tmp}.deduped"
    echo "    ✔ wrote ${LOCAL_ENV_FILES[$i]}"
    pulled=$((pulled + 1))
  else
    rm -f "$tmp"
    echo "    ⚠  No secrets found — skipped" >&2
    skipped=$((skipped + 1))
  fi

  echo ""
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
if [[ -n "$ONLY" && $pulled -eq 0 && $skipped -eq 0 ]]; then
  echo "Error: unknown target '${ONLY}'. Run with --list to see options." >&2
  exit 1
fi

echo "Done. ${pulled} env file(s) written, ${skipped} skipped."
