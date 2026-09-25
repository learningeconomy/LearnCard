#!/bin/bash
# A3: Induce WAF blocked spike alarm via k6 burst scenario.
# Staging-only guard. Cleanup: stop load test.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

HOST="auth.staging.learncard.app"

echo "Starting k6 burst scenario (500 req/min) to trigger WAF..."
echo "This will run for 2 minutes. WAF should block requests and alarm should fire."
echo "Cleanup: load test will stop automatically after 2 minutes."

k6 run infra/keycloak/qa/load.js -e HOST="$HOST" --scenario burst

echo "Burst complete. Check WAF metrics: aws wafv2 get-sampled-requests --web-acl-arn <arn> --rule-metric-name <rule>"
