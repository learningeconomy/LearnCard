#!/bin/bash
# A3: stop one service task; wait for replacement on success, failure or interruption.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

P=learncard-keycloak-staging
TASK_ARN=""
WAIT_FOR_REPLACEMENT=false
cleanup() {
  local status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ "${WAIT_FOR_REPLACEMENT}" == true ]]; then
    # Wait for the stopped task first: an immediate service waiter can see stale counts.
    if ! aws ecs wait tasks-stopped --cluster "${P}" --tasks "${TASK_ARN}"; then
      echo "ERROR: task ${TASK_ARN} has not stopped; inspect the service." >&2
      status=1
    fi
    if ! aws ecs wait services-stable --cluster "${P}" --services "${P}"; then
      echo "ERROR: ${P} did not recover; investigate replacement task health." >&2
      status=1
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

aws ecs wait services-stable --cluster "${P}" --services "${P}"
TASK_ARN=$(aws ecs list-tasks --cluster "${P}" --service-name "${P}" --desired-status RUNNING --query 'taskArns[0]' --output text)
[[ "${TASK_ARN}" == arn:*:ecs:*:*:task/* ]] || { echo 'ERROR: no running service task found.' >&2; exit 1; }
WAIT_FOR_REPLACEMENT=true
aws ecs stop-task --cluster "${P}" --task "${TASK_ARN}" --reason 'A3 staging alarm drill' >/dev/null
printf '%s\n' 'Waiting for ECS replacement. A quick replacement or remaining healthy tasks may prevent an alarm; do not claim a pass without evidence.'
printf 'Inspect %s-unhealthy and %s-degraded alarm history, running/desired metrics and SNS delivery after recovery.\n' "${P}" "${P}"
