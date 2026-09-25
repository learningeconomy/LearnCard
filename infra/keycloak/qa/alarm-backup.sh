#!/bin/bash
# A3: WARNING SNS delivery ONLY. Does not test Backup jobs or EventBridge matching.
set -euo pipefail
ENV="${1:-${ENV:-}}"
[[ "${ENV}" == staging ]] || { echo 'ERROR: explicitly select staging.' >&2; exit 1; }
[[ "${ALLOW_DESTRUCTIVE_ALARM_TEST:-}" == yes ]] || { echo 'ERROR: set ALLOW_DESTRUCTIVE_ALARM_TEST=yes to consent to disruption.' >&2; exit 1; }
[[ "${EXPECTED_AWS_ACCOUNT_ID:-}" =~ ^[0-9]{12}$ ]] || { echo 'ERROR: provide EXPECTED_AWS_ACCOUNT_ID (12 digits).' >&2; exit 1; }
export AWS_PAGER=""
ACTUAL_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
[[ "${ACTUAL_ACCOUNT}" == "${EXPECTED_AWS_ACCOUNT_ID}" ]] || { echo 'ERROR: AWS account mismatch.' >&2; exit 1; }

P=learncard-keycloak-staging
: "${WARNING_SNS_TOPIC_ARN:?Provide the existing staging warning SNS topic ARN}"
[[ "${WARNING_SNS_TOPIC_ARN}" == arn:aws:sns:*:"${EXPECTED_AWS_ACCOUNT_ID}":"${P}-warning" ]] || { echo 'ERROR: expected the staging warning topic in the verified account.' >&2; exit 1; }
# Unique run ID prevents overwriting a real alarm; preflight also refuses collisions.
ALARM="${P}-backup-delivery-drill-$(date -u +%Y%m%dT%H%M%SZ)-$$-${RANDOM}"
DELETE_ALARM=false
cleanup() {
  local status=$?
  trap - EXIT
  trap '' INT TERM
  if [[ "${DELETE_ALARM}" == true ]]; then
    if ! aws cloudwatch delete-alarms --alarm-names "${ALARM}"; then
      echo "ERROR: manually delete temporary alarm ${ALARM}." >&2
      status=1
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

aws sns get-topic-attributes --topic-arn "${WARNING_SNS_TOPIC_ARN}" >/dev/null
EXISTING=$(aws cloudwatch describe-alarms --alarm-names "${ALARM}" --output json)
jq -e '(.MetricAlarms | length) == 0 and (.CompositeAlarms | length) == 0' <<< "${EXISTING}" >/dev/null
printf 'Temporary delivery-only alarm: %s\n' "${ALARM}"
DELETE_ALARM=true
aws cloudwatch put-metric-alarm --alarm-name "${ALARM}" \
  --alarm-description 'A3 delivery-only drill; not evidence of Backup/EventBridge failure detection' \
  --namespace "${P}/QA" --metric-name BackupDeliveryDrill \
  --statistic Sum --period 60 --evaluation-periods 1 --threshold 0 \
  --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching \
  --actions-enabled --alarm-actions "${WARNING_SNS_TOPIC_ARN}" \
  --tags Key=Project,Value=learncard-keycloak Key=Environment,Value=staging Key=ManagedBy,Value=qa-drill
aws cloudwatch set-alarm-state --alarm-name "${ALARM}" --state-value ALARM \
  --state-reason 'A3 delivery-only drill; no backup job was failed'
printf '%s\n' 'Verify the notification at the warning SNS destination. This is NOT a Backup or EventBridge end-to-end test.'
# Keep the alarm available briefly for asynchronous action/history inspection.
sleep 60
printf '%s\n' 'Deleting temporary alarm; no production alarm state was changed.'
