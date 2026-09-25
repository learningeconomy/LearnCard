#!/bin/bash
# A3: Induce CPU/ACU/connections alarms via k6 load test.
# Staging-only guard. Cleanup: stop load test.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

HOST="auth.staging.learncard.app"

echo "Starting k6 load test to exceed capacity thresholds..."
echo "This will run for 5 minutes. Alarms should fire during the test."
echo "Cleanup: load test will stop automatically after 5 minutes."

k6 run infra/keycloak/qa/load.js -e HOST="$HOST" --scenario burst

echo "Load test complete. Alarms should return to OK as load decreases."
