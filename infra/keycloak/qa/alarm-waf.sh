#!/bin/bash
# A3: WAF burst; count mode is observation-only, not a BlockedRequests alarm test.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

HOST=auth.staging.learncard.app
export CONFIRM_STAGING_LOAD=true DURATION=5m
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

# load.js selects options.scenarios using __ENV.SCENARIO (not a k6 CLI flag).
# Refuse older load.js versions that would accidentally run multiple scenarios.
OPTIONS=$(SCENARIO=burst HOST="${HOST}" k6 inspect --include-system-env-vars "${SCRIPT_DIR}/load.js")
jq -e '.scenarios | keys == ["burst"]' <<< "${OPTIONS}" >/dev/null
printf '%s\n' 'Sending 500 requests/min for 5 min from one IP.'
printf '%s\n' 'Count mode emits CountedRequests and CANNOT fire the BlockedRequests alarm.'
printf '%s\n' 'Do not change WAF mode here. Verify actual rule mode, metrics, alarm history, and SNS delivery separately.'
SCENARIO=burst HOST="${HOST}" k6 run "${SCRIPT_DIR}/load.js" &
LOAD_PID=$!
wait "${LOAD_PID}"
LOAD_PID=""
printf '%s\n' 'Burst ended; this does not by itself prove an alarm or SNS delivery.'
