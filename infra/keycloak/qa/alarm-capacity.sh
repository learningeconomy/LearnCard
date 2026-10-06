#!/bin/bash
# A3: sustained capacity drill, not a burst of rejected password grants.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

# Supply a fresh staging session; load.js must rotate refresh tokens per VU and
# fail on rejected grants. Never pass tokens in command arguments or print them.
: "${REFRESH_TOKENS:?Provide JSON array of independent staging refresh sessions, one per VU}"
: "${CLIENT_ID:?Provide the staging client ID for these sessions}"
export REFRESH_TOKENS CLIENT_ID
export CONFIRM_STAGING_LOAD=true SCENARIO=capacity DURATION=20m
HOST=auth.staging.learncard.app
SCRIPT_DIR=$(dirname -- "${BASH_SOURCE[0]}")
LOAD_PID=""
cleanup() {
  local status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ -n "${LOAD_PID}" ]]; then
    kill -TERM "${LOAD_PID}" 2>/dev/null || true
    wait "${LOAD_PID}" 2>/dev/null || true
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Inspect the selected capacity scenario: a full 20-minute hold plus ramp up/down.
OPTIONS=$(HOST="${HOST}" k6 inspect --include-system-env-vars "${SCRIPT_DIR}/load.js")
jq -e '(.scenarios | keys == ["capacity"]) and
  (.scenarios.capacity.executor == "ramping-arrival-rate") and
  (.scenarios.capacity.stages[1].duration | . == "20m" or . == "20m0s" or . == "1200s") and
  (.scenarios.capacity.stages[1].target > 0)' <<< "${OPTIONS}" >/dev/null
printf '%s\n' 'Running valid refresh workload for 20 minutes; confirm successful token responses in k6 results.'
printf '%s\n' 'Use the reviewed staging sizing rate; WAF throttling/rejected grants do not prove DB capacity.'
HOST="${HOST}" k6 run "${SCRIPT_DIR}/load.js" &
LOAD_PID=$!
wait "${LOAD_PID}"
LOAD_PID=""
printf '%s\n' 'Load ended. Check CPU/ACU/connections, scaling activities, alarm history, SNS delivery and recovery; no automatic pass is claimed.'
