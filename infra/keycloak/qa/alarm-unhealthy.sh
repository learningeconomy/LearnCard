#!/bin/bash
# A3: Induce unhealthy hosts alarm by stopping one task.
# Staging-only guard. Cleanup: ECS replaces task automatically.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

P="learncard-keycloak-$ENV"

echo "Stopping one task in $P..."
TASK_ARN=$(aws ecs list-tasks --cluster "$P" --service-name "$P" --query 'taskArns[0]' --output text)
if [[ -z "$TASK_ARN" || "$TASK_ARN" == "None" ]]; then
  echo "ERROR: No tasks found in $P"
  exit 1
fi

aws ecs stop-task --cluster "$P" --task "$TASK_ARN" --reason "A3 alarm drill"
echo "Task stopped: $TASK_ARN"
echo "Alarm should fire within 5 minutes. Check: aws cloudwatch describe-alarm-history --alarm-name $P-unhealthy"
echo "Cleanup: ECS will replace the task automatically."
