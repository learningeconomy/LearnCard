#!/bin/bash
# A3: Induce backup failure alarm via set-alarm-state (delivery test only).
# Cannot safely induce real backup failure. Staging-only guard.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

P="learncard-keycloak-$ENV"

echo "Delivery test: setting backup failure alarm state to ALARM..."
aws cloudwatch set-alarm-state \
  --alarm-name "$P-backup-failed" \
  --state-value ALARM \
  --state-reason "A3 alarm drill - delivery test"
echo "Alarm state set. SNS notification should be received."
echo "Cleanup: reset alarm state to OK."
aws cloudwatch set-alarm-state \
  --alarm-name "$P-backup-failed" \
  --state-value OK \
  --state-reason "A3 alarm drill - cleanup"
echo "Alarm reset to OK."
