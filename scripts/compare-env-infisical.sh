#!/usr/bin/env bash
# ============================================================================
# compare-env-infisical.sh — Compare current .env files against Infisical
# ============================================================================
# Lists keys that are missing from Infisical, only present in Infisical, or
# changed between each current .env file and the live Infisical export for the
# same service target.
#
# Usage:
#   pnpm env:compare-infisical
# ============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SERVICE_KEYS=(
  brain
  cloud
  app
  lca-api
  signing
)

INFISICAL_PATHS=(
  "/LearnCard/brain-service"
  "/LearnCard/cloud-service"
  "/learn-card-app"
  "/LearnCard/lca-api"
  "/LearnCard/simple-signing-service"
)

LOCAL_ENV_FILES=(
  "services/learn-card-network/brain-service/.env"
  "services/learn-card-network/learn-cloud-service/.env"
  "apps/learn-card-app/.env"
  "services/learn-card-network/lca-api/.env"
  "services/learn-card-network/simple-signing-service/.env"
)

SERVICE_LABELS=(
  "Brain Service"
  "LearnCloud Service"
  "LearnCard App"
  "LCA API"
  "Simple Signing Service"
)

ENV_SLUG="dev"
PROJECT_ID_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --env=*)       ENV_SLUG="${arg#*=}" ;;
    --projectId=*) PROJECT_ID_FLAG="--projectId=${arg#*=}" ;;
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

if ! command -v infisical &>/dev/null; then
  echo "Error: 'infisical' CLI not found." >&2
  echo "Install it: https://infisical.com/docs/cli/overview" >&2
  exit 1
fi

echo "Comparing local .env files against Infisical (env=${ENV_SLUG})..."
echo ""

parse_and_compare() {
  local env_file="$1"
  local export_file="$2"

  python3 - "$env_file" "$export_file" <<'PY'
import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

local_file = Path(sys.argv[1])
export_file = Path(sys.argv[2])


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


local = parse_env_file(local_file)
exported = normalize_export_data(json.loads(export_file.read_text(encoding="utf-8") or "{}"))

missing = [key for key in local.keys() if key not in exported]
infisical_only = [key for key in exported.keys() if key not in local]
changed = [key for key in local.keys() if key in exported and local[key] != exported[key]]

if not missing and not infisical_only and not changed:
    print("    No differences.")
else:
    if missing:
        print(f"    Missing from Infisical ({len(missing)}): {', '.join(missing)}")
    if infisical_only:
        print(f"    Only in Infisical ({len(infisical_only)}): {', '.join(infisical_only)}")
    if changed:
        print(f"    Changed values ({len(changed)}): {', '.join(changed)}")
PY
}

echo ""

for i in "${!SERVICE_KEYS[@]}"; do
  key="${SERVICE_KEYS[$i]}"
  label="${SERVICE_LABELS[$i]}"
  path="${INFISICAL_PATHS[$i]}"
  env_file="${REPO_ROOT}/${LOCAL_ENV_FILES[$i]}"

  echo "  ▸ ${label} (${key})"

  if [[ ! -f "$env_file" ]]; then
    echo "    ⚠ local .env file not found — skipped"
    echo ""
    continue
  fi

  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT
  export_file="${tmp_dir}/export.json"

  echo "    pulling from ${path} ..."
  # shellcheck disable=SC2086
  if infisical export \
    --env="$ENV_SLUG" \
    --path="$path" \
    --format=json \
    --include-imports \
    --output-file="$export_file" \
    $PROJECT_ID_FLAG >/dev/null; then
    parse_and_compare "$env_file" "$export_file"
  else
    echo "    ⚠  Warning: failed to export path '${path}' — skipped" >&2
  fi

  rm -rf "$tmp_dir"
  trap - EXIT
  echo ""
done
