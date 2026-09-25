#!/bin/bash
# A3: Induce ALB 5xx alarm via set-alarm-state (delivery test) + real test (scale to 0).
# Staging-only guard. Cleanup: scale back up.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

P="learncard-keycloak-$ENV"

echo "Delivery test: setting alarm state to ALARM..."
aws cloudwatch set-alarm-state \
  --alarm-name "$P-public-5xx" \
  --state-value ALARM \
  --state-reason "A3 alarm drill - delivery test"
echo "Alarm state set. SNS notification should be received."

echo ""
echo "Real test: scaling service to 0 for 2 minutes..."
DESIRED=$(aws ecs describe-services --cluster "$P" --services "$P" --query 'services[0].desiredCount' --output text)
aws ecs update-service --cluster "$P" --service "$P" --desired-count 0
echo "Service scaled to 0. ALB should return 5xx."
sleep 120
echo "Scaling back to $DESIRED..."
aws ecs update-service --cluster "$P" --service "$P" --desired-count "$DESIRED"
aws ecs wait services-stable --cluster "$P" --services "$P"
echo "Service restored. Alarm should return to OK."
