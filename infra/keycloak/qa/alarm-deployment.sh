#!/bin/bash
# A3: ECS deployment failure -> EventBridge SERVICE_DEPLOYMENT_FAILED -> SNS.
# No deployment-failed metric alarm exists. Run without concurrent deployments.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

P=learncard-keycloak-staging
ORIGINAL=""
NEW_ARN=""
RESTORE_SERVICE=false
cleanup() {
  local status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ "${RESTORE_SERVICE}" == true ]]; then
    if ! aws ecs update-service --cluster "${P}" --service "${P}" --task-definition "${ORIGINAL}" >/dev/null; then
      echo "ERROR: manually restore ${P} to ${ORIGINAL}." >&2
      status=1
    elif ! aws ecs wait services-stable --cluster "${P}" --services "${P}"; then
      echo "ERROR: recovery to ${ORIGINAL} is not stable; investigate immediately." >&2
      status=1
    fi
  fi
  if [[ -n "${NEW_ARN}" ]]; then
    if ! aws ecs deregister-task-definition --task-definition "${NEW_ARN}" >/dev/null; then
      echo "ERROR: manually deregister drill revision ${NEW_ARN}." >&2
      status=1
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

aws ecs wait services-stable --cluster "${P}" --services "${P}"
SERVICE=$(aws ecs describe-services --cluster "${P}" --services "${P}" --output json)
jq -e '.services[0] | .desiredCount > 0 and
  .deploymentConfiguration.deploymentCircuitBreaker.enable == true and
  .deploymentConfiguration.deploymentCircuitBreaker.rollback == true' <<< "${SERVICE}" >/dev/null
ORIGINAL=$(jq -er '.services[0].taskDefinition' <<< "${SERVICE}")
DEFINITION=$(aws ecs describe-task-definition --task-definition "${ORIGINAL}" --query taskDefinition --output json)
jq -e '[.containerDefinitions[] | select(.name == "keycloak")] | length == 1' <<< "${DEFINITION}" >/dev/null
IMAGE=$(jq -er '.containerDefinitions[] | select(.name == "keycloak") | .image' <<< "${DEFINITION}")
[[ "${IMAGE}" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/[^@]+@sha256:[a-f0-9]{64}$ ]] || { echo 'ERROR: expected a digest-pinned ECR Keycloak image.' >&2; exit 1; }
[[ "${IMAGE%%.*}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: image registry account mismatch.' >&2; exit 1; }
INVALID_IMAGE="${IMAGE%@*}@sha256:0000000000000000000000000000000000000000000000000000000000000000"
# Keep sidecars untouched; invalid content digest, syntactically valid ECR image URI.
INPUT=$(jq --arg image "${INVALID_IMAGE}" '
  (.containerDefinitions[] | select(.name == "keycloak") | .image) = $image |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities,
      .registeredAt, .registeredBy, .deregisteredAt)' <<< "${DEFINITION}")
printf 'Recovery revision: %s\n' "${ORIGINAL}"
NEW_ARN=$(aws ecs register-task-definition --cli-input-json "${INPUT}" \
  --tags key=Project,value=learncard-keycloak key=Environment,value=staging key=ManagedBy,value=qa-drill \
  --query taskDefinition.taskDefinitionArn --output text)
[[ "${NEW_ARN}" == arn:*:ecs:*:*:task-definition/*:* ]] || { echo 'ERROR: registration did not return an ARN; inspect task definitions manually.' >&2; NEW_ARN=""; exit 1; }
printf 'Drill revision: %s\n' "${NEW_ARN}"
RESTORE_SERVICE=true
aws ecs update-service --cluster "${P}" --service "${P}" --task-definition "${NEW_ARN}" >/dev/null
END=$((SECONDS + 1200))
OBSERVED=false
SEEN_DRILL=false
while (( SECONDS < END )); do
  SERVICE=$(aws ecs describe-services --cluster "${P}" --services "${P}" --output json)
  if jq -e --arg arn "${NEW_ARN}" '.services[0] | any(.deployments[]; .taskDefinition == $arn)' <<< "${SERVICE}" >/dev/null; then
      SEEN_DRILL=true
    fi
    if jq -e --arg arn "${NEW_ARN}" --arg original "${ORIGINAL}" --argjson seen "${SEEN_DRILL}" '.services[0] |
      any(.deployments[]; .taskDefinition == $arn and .rolloutState == "FAILED") or
      ($seen and .taskDefinition == $original and any(.deployments[]; .taskDefinition == $original and .status == "PRIMARY"))' <<< "${SERVICE}" >/dev/null; then
      OBSERVED=true
      break
    fi
  sleep 15
done
[[ "${OBSERVED}" == true ]] || { echo 'ERROR: no deployment failure/rollback observed within 20 minutes.' >&2; exit 1; }
printf '%s\n' 'Failure/rollback observed; verify SERVICE_DEPLOYMENT_FAILED EventBridge delivery at the SNS destination.'
printf '%s\n' 'Cleanup explicitly restores the original revision and deregisters the drill revision.'
