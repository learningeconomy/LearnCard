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
#   /LearnCard/brain-service       → brain-service secrets
#   /LearnCard/cloud-service       → learn-cloud-service secrets
#   /learn-card-app                → learn-card-app secrets
#   /LearnCard/lca-api             → lca-api secrets
#   /                              → root-level shared vars (currently only used
#                                     for simple-signing-service)
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

# Infisical folder paths — use "|" to merge multiple paths into one export.
# Paths are exported in order; later paths overwrite earlier keys.
INFISICAL_PATHS=(
  "/LearnCard/brain-service"                  # brain
  "/LearnCard/cloud-service"                  # cloud
  "/learn-card-app"                           # app
  "/LearnCard/lca-api"                        # lca-api
  "/LearnCard/simple-signing-service"         # signing
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
# Helper functions
# ---------------------------------------------------------------------------
base_template_for_env_file() {
  local env_file="$1"
  local example_env="${env_file}.example"

  if [[ -f "$env_file" ]]; then
    printf '%s\n' "$env_file"
  elif [[ -f "$example_env" ]]; then
    printf '%s\n' "$example_env"
  else
    printf '%s\n' ""
  fi
}

export_path_to_json() {
  local path="$1"
  local output_file="$2"

  # shellcheck disable=SC2086
  infisical export \
    --env="$ENV_SLUG" \
    --path="$path" \
    --format=json \
    --include-imports \
    --output-file="$output_file" \
    $PROJECT_ID_FLAG >/dev/null
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
  base_template_file="$(base_template_for_env_file "$env_file")"

  # Filter by --only if set
  if [[ -n "$ONLY" && "$key" != "$ONLY" ]]; then
    continue
  fi

  echo "  ▸ ${label} (${key})"

  # Split paths on "|"
  IFS='|' read -ra paths <<< "$paths_str"

  # Create a temp directory to hold JSON exports
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT

  export_json_files=()
  for p in "${paths[@]}"; do
    export_name="$(printf '%s' "$p" | tr '/:' '__' | tr -cd '[:alnum:]_')"
    export_file="${tmp_dir}/${export_name:-root}.json"
    echo "    pulling from ${p} ..."
    if export_path_to_json "$p" "$export_file"; then
      export_json_files+=("$export_file")
    else
      echo "    ⚠  Warning: failed to export path '${p}' — skipping" >&2
    fi
  done

  if [[ ${#export_json_files[@]} -gt 0 ]]; then
    # Ensure parent directory exists
    mkdir -p "$(dirname "$env_file")"

    python3 - "$base_template_file" "$env_file" "$ENV_SLUG" "${export_json_files[@]}" <<'PY'
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

base_template = Path(sys.argv[1])
output_file = Path(sys.argv[2])
env_slug = sys.argv[3]
export_files = [Path(p) for p in sys.argv[4:]]


def parse_env_file(path: Path) -> OrderedDict[str, str]:
    values: OrderedDict[str, str] = OrderedDict()
    if not path.exists():
        return values

    lines = path.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line or line.lstrip().startswith("#"):
            i += 1
            continue

        match = re.match(r"^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$", line)
        if not match:
            i += 1
            continue

        key, raw_value = match.groups()
        if raw_value.startswith(("'", '"')):
            quote = raw_value[0]
            if len(raw_value) > 1 and raw_value.endswith(quote) and not raw_value.endswith("\\" + quote):
                value = raw_value[1:-1]
                i += 1
            else:
                value_lines = [raw_value[1:]]
                i += 1
                while i < len(lines):
                    part = lines[i]
                    if part.endswith(quote) and not part.endswith("\\" + quote):
                        value_lines.append(part[:-1])
                        i += 1
                        break
                    value_lines.append(part)
                    i += 1
                value = "\n".join(value_lines)
        else:
            value = raw_value
            i += 1

        values[key] = value

    return values


merged: OrderedDict[str, str] = parse_env_file(base_template)
base_order = list(merged.keys())


def normalize_export_data(data) -> dict[str, str]:
    if isinstance(data, dict):
        if "secrets" in data and isinstance(data["secrets"], list):
            return normalize_export_data(data["secrets"])
        return {str(key): "" if value is None else str(value) for key, value in data.items()}

    if isinstance(data, list):
        normalized: dict[str, str] = {}
        for item in data:
            if isinstance(item, dict):
                key = (
                    item.get("Key")
                    or item.get("key")
                    or item.get("name")
                    or item.get("secretKey")
                    or item.get("secret_name")
                )
                value = (
                    item.get("Value")
                    or item.get("value")
                    or item.get("secretValue")
                    or item.get("secret_value")
                )
                if key is not None:
                    normalized[str(key)] = "" if value is None else str(value)
            elif isinstance(item, list) and len(item) == 2:
                normalized[str(item[0])] = "" if item[1] is None else str(item[1])
        return normalized

    return {}


for export_file in export_files:
    if not export_file.exists():
        continue
    data = json.loads(export_file.read_text(encoding="utf-8") or "{}")
    for key, value in normalize_export_data(data).items():
        merged[key] = "" if value is None else str(value)


def quote_value(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


lines = [
    f"# Auto-generated by pull-env.sh from Infisical (env={env_slug})",
    "# Do not edit manually — changes will be overwritten on next pull.",
    "",
]

for key in base_order:
    if key in merged:
        lines.append(f"{key}={quote_value(merged[key])}")

for key, value in merged.items():
    if key not in base_order:
        lines.append(f"{key}={quote_value(value)}")

output_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
PY

    echo "    ✔ wrote ${LOCAL_ENV_FILES[$i]}"
    pulled=$((pulled + 1))
  else
    echo "    ⚠  No secrets found — skipped" >&2
    skipped=$((skipped + 1))
  fi

  rm -rf "$tmp_dir"
  trap - EXIT

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
