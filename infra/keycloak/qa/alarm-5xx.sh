#!/bin/bash
# A3: delivery check plus a two-minute real ALB outage. Run without concurrent deploys/drills.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

P=learncard-keycloak-staging
RESOURCE="service/${P}/${P}"
URL=https://auth.staging.learncard.app/realms/learncard/.well-known/openid-configuration
RESTORE_SERVICE=false
RESTORE_SCALING=false
DESIRED=""
SUSPENDED=""
cleanup() {
  local status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ "${RESTORE_SERVICE}" == true ]]; then
    if ! aws ecs update-service --cluster "${P}" --service "${P}" --desired-count "${DESIRED}" >/dev/null; then
      echo "ERROR: manually restore ${P} desired count to ${DESIRED}." >&2
      status=1
    elif ! aws ecs wait services-stable --cluster "${P}" --services "${P}"; then
      echo 'ERROR: service recovery not stable; investigate immediately.' >&2
      status=1
    fi
  fi
  # Attempt this even if service restoration failed. Preserve all three original flags.
  if [[ "${RESTORE_SCALING}" == true ]]; then
    if ! aws application-autoscaling register-scalable-target --service-namespace ecs \
      --resource-id "${RESOURCE}" --scalable-dimension ecs:service:DesiredCount \
      --suspended-state "${SUSPENDED}" >/dev/null; then
      echo "ERROR: manually restore ${RESOURCE} suspended state: ${SUSPENDED}" >&2
      status=1
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

aws ecs wait services-stable --cluster "${P}" --services "${P}"
DESIRED=$(aws ecs describe-services --cluster "${P}" --services "${P}" --query 'services[0].desiredCount' --output text)
[[ "${DESIRED}" =~ ^[1-9][0-9]*$ ]] || { echo 'ERROR: expected a running service.' >&2; exit 1; }
TARGET=$(aws application-autoscaling describe-scalable-targets --service-namespace ecs \
  --resource-ids "${RESOURCE}" --scalable-dimension ecs:service:DesiredCount --output json)
SUSPENDED=$(jq -ce '.ScalableTargets | select(length == 1) | .[0].SuspendedState |
  select((.DynamicScalingInSuspended | type) == "boolean" and
         (.DynamicScalingOutSuspended | type) == "boolean" and
         (.ScheduledScalingSuspended | type) == "boolean")' <<< "${TARGET}")
curl --fail --silent --show-error --max-time 10 "${URL}" >/dev/null
printf 'Recovery baseline: desired=%s suspended=%s\n' "${DESIRED}" "${SUSPENDED}"
aws cloudwatch set-alarm-state --alarm-name "${P}-public-5xx" --state-value ALARM \
  --state-reason 'A3 delivery-only check; real outage follows'
# Arm cleanup before mutations, including calls whose response might be lost.
RESTORE_SCALING=true
aws application-autoscaling register-scalable-target --service-namespace ecs \
  --resource-id "${RESOURCE}" --scalable-dimension ecs:service:DesiredCount \
  --suspended-state 'DynamicScalingInSuspended=true,DynamicScalingOutSuspended=true,ScheduledScalingSuspended=true' >/dev/null
RESTORE_SERVICE=true
aws ecs update-service --cluster "${P}" --service "${P}" --desired-count 0 >/dev/null
aws ecs wait services-stable --cluster "${P}" --services "${P}"

# >100 discovery 5xx responses over 120s satisfies the >=50-request guard even
# when traffic straddles a five-minute metric boundary. Never treat network errors as 5xx.
END=$((SECONDS + 120))
ERRORS=0
while (( SECONDS < END )); do
  CODE=$(curl --silent --max-time 0.8 --output /dev/null --write-out '%{http_code}' "${URL}") || CODE=000
  if [[ "${CODE}" == 5[0-9][0-9] ]]; then ERRORS=$((ERRORS + 1)); fi
  sleep 0.2
done
printf 'Observed %s HTTP 5xx responses; restoring service now.\n' "${ERRORS}"
[[ "${ERRORS}" -ge 100 ]] || { echo 'ERROR: insufficient real 5xx traffic; drill inconclusive.' >&2; exit 1; }
printf '%s\n' 'Inspect real ALB metrics and SNS delivery after evaluation; set-alarm-state alone is not proof of the real alarm.'
