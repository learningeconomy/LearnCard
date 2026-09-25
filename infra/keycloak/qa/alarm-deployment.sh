#!/bin/bash
# A3: Induce deployment failure alarm by deploying invalid image digest.
# Staging-only guard. Cleanup: auto-rollback via circuit breaker.

set -euo pipefail

ENV="${1:-staging}"
if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: This alarm test is staging-only. Use ENV=staging or remove the guard for production."
  exit 1
fi

P="learncard-keycloak-$ENV"

echo "Fetching current task definition..."
TASK_DEF=$(aws ecs describe-services --cluster "$P" --services "$P" --query 'services[0].taskDefinition' --output text)
echo "Current task definition: $TASK_DEF"

echo "Registering new task definition with invalid image digest..."
INVALID_IMAGE="learncard/keycloak:invalid-digest-sha256:0000000000000000000000000000000000000000000000000000000000000000"
aws ecs register-task-definition \
  --cli-input-json "$(aws ecs describe-task-definition --task-definition "$TASK_DEF" --query 'taskDefinition' | jq --arg img "$INVALID_IMAGE" '.containerDefinitions[0].image = $img | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)')" \
  > /dev/null
echo "Invalid task definition registered."

echo "Updating service with invalid image..."
NEW_TASK_DEF=$(aws ecs describe-task-definition --task-definition "$TASK_DEF" --query 'taskDefinition.family' --output text)
aws ecs update-service --cluster "$P" --service "$P" --task-definition "$NEW_TASK_DEF" > /dev/null
echo "Service updated. Deployment should fail and circuit breaker should rollback."
echo "Check: aws cloudwatch describe-alarm-history --alarm-name $P-deployment-failed"
echo "Cleanup: auto-rollback via circuit breaker (no manual action needed)."
