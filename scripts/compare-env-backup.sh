#!/usr/bin/env bash
# ============================================================================
# compare-env-backup.sh — Compare current .env files against .env.backup copies
# ============================================================================
# Lists keys that were added, removed, or changed between each current .env
# file and its matching .env.backup file.
#
# Usage:
#   pnpm env:compare-backup
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

echo "Comparing current .env files against .env.backup copies..."
echo ""

for rel_path in "${ENV_FILES[@]}"; do
  current_file="${REPO_ROOT}/${rel_path}"
  backup_file="${current_file}.backup"

  echo "  ▸ ${rel_path}"

  if [[ ! -f "$current_file" ]]; then
    echo "    ⚠ current .env file not found — skipped"
    echo ""
    continue
  fi

  if [[ ! -f "$backup_file" ]]; then
    echo "    ⚠ backup file not found — skipped"
    echo ""
    continue
  fi

  python3 - "$current_file" "$backup_file" <<'PY'
import re
import sys
from collections import OrderedDict
from pathlib import Path

current_file = Path(sys.argv[1])
backup_file = Path(sys.argv[2])


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


current = parse_env_file(current_file)
backup = parse_env_file(backup_file)

added = [key for key in current.keys() if key not in backup]
removed = [key for key in backup.keys() if key not in current]
changed = [key for key in current.keys() if key in backup and current[key] != backup[key]]

if not added and not removed and not changed:
    print("    No differences.")
else:
    if added:
        print(f"    Added keys ({len(added)}): {', '.join(added)}")
    if removed:
        print(f"    Removed keys ({len(removed)}): {', '.join(removed)}")
    if changed:
        print(f"    Changed keys ({len(changed)}): {', '.join(changed)}")
PY

  echo ""
done
