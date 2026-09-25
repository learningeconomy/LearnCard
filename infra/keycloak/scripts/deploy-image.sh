#!/usr/bin/env bash
# shellcheck disable=SC2016 # Literal Markdown and JMESPath backticks, not substitutions.
set -euo pipefail
# AWS calls occur only in the protected environment job, never in local validation.
: "${DEPLOY_ENVIRONMENT:?}"
: "${TF_STATE_BUCKET:?}"
: "${TF_VAR_keycloak_image:?}"
: "${GITHUB_SHA:?}"
release_sha=${RELEASE_SHA:-$GITHUB_SHA}
# Leave ten minutes before the workflow's 150-minute hard step timeout. The
# workflow also supplies an absolute job deadline to account for earlier steps.
DEPLOY_DEADLINE_EPOCH=$(( $(date +%s) + 140 * 60 ))
if [[ -n ${DEPLOY_JOB_DEADLINE_EPOCH:-} ]]; then
    [[ "$DEPLOY_JOB_DEADLINE_EPOCH" =~ ^[0-9]+$ ]]
    if (( DEPLOY_JOB_DEADLINE_EPOCH < DEPLOY_DEADLINE_EPOCH )); then
        DEPLOY_DEADLINE_EPOCH=$DEPLOY_JOB_DEADLINE_EPOCH
    fi
fi
[[ "$DEPLOY_ENVIRONMENT" == staging || "$DEPLOY_ENVIRONMENT" == production ]]
[[ "$TF_VAR_keycloak_image" =~ @sha256:[0-9a-f]{64}$ ]]
scripts="$PWD/infra/keycloak/scripts"
# CodeBuild checks out release_sha, not local/uncommitted inputs or a newer main.
# Fail before even creating the journal, taking a snapshot, or installing cleanup.
realm_stage=keycloak-staging
realm_label=Staging
if [[ "$DEPLOY_ENVIRONMENT" == production ]]; then
    realm_stage=production
    realm_label=Production
fi
for input in "infra/keycloak/terraform/realm/environments/$DEPLOY_ENVIRONMENT.tfvars" \
    "infra/keycloak/terraform/realm/generated/$realm_stage.tfvars.json"; do
    if [[ ! -s "$input" ]] || ! GIT_MASTER=1 git show "$release_sha:$input" 2>/dev/null | cmp -s "$input" -; then
        printf '%s realm inputs are not committed: %s (must be non-empty and match source revision %s).\n' \
            "$realm_label" "$input" "$release_sha" >&2
        exit 1
    fi
done
# shellcheck source=infra/keycloak/scripts/realm-runner.sh
source "$scripts/realm-runner.sh"
root=infra/keycloak/terraform/service
name="learncard-keycloak-$DEPLOY_ENVIRONMENT"
prefix="keycloak/$DEPLOY_ENVIRONMENT/compat"
umask 077
work=$(mktemp -d)
stopped=false
complete=false
cleanup() {
    local result=$? runner_stopped=true
    trap - EXIT
    trap '' INT TERM HUP
    stop_realm_build "$work/realm-build-id" || { runner_stopped=false; result=1; }
    if [[ "$runner_stopped" == true && "$stopped" == true && "$complete" != true ]]; then
        # No automatic rollback across a possible schema migration. Leave scaling suspended.
        aws application-autoscaling register-scalable-target --service-namespace ecs \
            --resource-id "service/$name/$name" --scalable-dimension ecs:service:DesiredCount \
            --min-capacity 0 --max-capacity "$maximum" \
            --suspended-state DynamicScalingInSuspended=true,DynamicScalingOutSuspended=true,ScheduledScalingSuspended=true >/dev/null || true
        aws ecs update-service --cluster "$name" --service "$name" --desired-count 0 >/dev/null || true
        printf '::error::Deployment failed; service stopped, autoscaling suspended. Follow snapshot recovery runbook.\n'
    fi
    rm -rf "$work"
    rm -f "$root/"{keycloak.tfplan,plan.json,plan.log,init.log,apply.log}
    exit "$result"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
# List + get distinguishes genuinely absent objects from access/network failures.
download_optional() {
    local key=$1 destination=$2 count
    count=$(aws s3api list-objects-v2 --bucket "$TF_STATE_BUCKET" --prefix "$key" --output json | \
        jq --arg key "$key" '[.Contents[]? | select(.Key == $key)] | length')
    if [[ "$count" == 1 ]]; then
        aws s3api get-object --bucket "$TF_STATE_BUCKET" --key "$key" "$destination" >/dev/null
    elif [[ "$count" != 0 ]]; then
        printf 'Unexpected metadata listing; refusing deployment.\n' >&2; exit 1
    fi
}
download_optional "$prefix/deployment.json" "$work/deployment.json"
if [[ -f "$work/deployment.json" ]]; then
    jq -e '.status == "complete"' "$work/deployment.json" >/dev/null || {
        printf 'Prior deployment incomplete; operator reconciliation required.\n' >&2; exit 1;
    }
fi
download_optional "$prefix/metadata.json" "$work/prev.json"
bash "$scripts/terraform-plan.sh" service
# Mirror every non-secret ECS environment option from the actual candidate plan.
# Features/build options remain baked in the image. No DB/admin secrets are required.
jq -er '.resource_changes[] | select(.address == "aws_ecs_task_definition.keycloak") |
    .change.after.container_definitions | fromjson | .[] | select(.name == "keycloak") |
    .environment[] | .name + "=" + .value' "$root/plan.json" >"$work/runtime.env"
export KC_ENV_FILE="$work/runtime.env"
docker pull "$TF_VAR_keycloak_image" >/dev/null
GITHUB_OUTPUT="$work/gate" bash "$scripts/compat-gate.sh" "$work/prev.json" "$TF_VAR_keycloak_image"
strategy=$(cut -d= -f2 "$work/gate")
if [[ "$strategy" == recreate ]]; then
    # A saved plan changing the scalable target can reintroduce a positive min
    # during apply, before our controlled restart. Require sizing as a separate
    # compatible deployment rather than racing Terraform's target registration.
    jq -e '[.resource_changes[] | select(.address == "aws_appautoscaling_target.keycloak") |
        .change.actions] == [["no-op"]]' "$root/plan.json" >/dev/null || {
        printf 'Recreate requires unchanged autoscaling target; apply sizing separately first.\n' >&2; exit 1;
    }
fi
# Generate before mutation too: an invalid candidate must not stop a healthy service.
bash "$scripts/compat-metadata.sh" "$TF_VAR_keycloak_image" "$work/metadata.json"
aws ecs describe-services --cluster "$name" --services "$name" >"$work/service.json"
desired=$(jq -er '.services[0].desiredCount | select(. > 0)' "$work/service.json")
if [[ "$strategy" == recreate ]]; then
    # Snapshot while healthy, before touching capacity. Production cannot opt out.
    if [[ "$DEPLOY_ENVIRONMENT" == production || ${SNAPSHOT_STAGING:-false} == true ]]; then
        snapshot="$name-pre-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"
        aws rds create-db-cluster-snapshot --db-cluster-identifier "$name" \
            --db-cluster-snapshot-identifier "$snapshot" \
            --tags Key=Project,Value=learncard-keycloak >/dev/null
        aws rds wait db-cluster-snapshot-available --db-cluster-snapshot-identifier "$snapshot"
        printf 'Pre-upgrade snapshot: `%s`\n' "$snapshot" >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
    fi
fi
# Durable journal prevents a retry from trusting stale metadata after partial apply.
jq -n --arg image "$TF_VAR_keycloak_image" --arg sha "$release_sha" --arg strategy "$strategy" \
    '{status:"pending",image:$image,sha:$sha,strategy:$strategy}' >"$work/deployment.json"
aws s3 cp "$work/deployment.json" "s3://$TF_STATE_BUCKET/$prefix/deployment.json" --only-show-errors
if [[ "$strategy" == recreate ]]; then
    aws application-autoscaling describe-scalable-targets --service-namespace ecs \
        --resource-ids "service/$name/$name" --scalable-dimension ecs:service:DesiredCount >"$work/scaling.json"
    minimum=$(jq -er '.ScalableTargets[0].MinCapacity' "$work/scaling.json")
    maximum=$(jq -er '.ScalableTargets[0].MaxCapacity' "$work/scaling.json")
    suspended=$(jq -cer '.ScalableTargets[0].SuspendedState' "$work/scaling.json")
    aws application-autoscaling register-scalable-target --service-namespace ecs \
        --resource-id "service/$name/$name" --scalable-dimension ecs:service:DesiredCount \
        --min-capacity 0 --max-capacity "$maximum" \
        --suspended-state DynamicScalingInSuspended=true,DynamicScalingOutSuspended=true,ScheduledScalingSuspended=true >/dev/null
    stopped=true
    old_tasks=$(aws ecs list-tasks --cluster "$name" --service-name "$name" --query taskArns --output json)
    aws ecs update-service --cluster "$name" --service "$name" --desired-count 0 >/dev/null
    aws ecs wait services-stable --cluster "$name" --services "$name"
    # Stability at desired=0 alone is not proof that draining tasks have exited.
    # Re-list AFTER scale-down, including desired STOPPED: those tasks can still
    # have lastStatus RUNNING/DEACTIVATING and database connections. Also catches
    # replacements launched between our original listing and the scale-down.
    for desired_status in RUNNING STOPPED; do
        remaining=$(aws ecs list-tasks --cluster "$name" --service-name "$name" \
            --desired-status "$desired_status" --query taskArns --output json)
        old_tasks=$(jq -cn --argjson old "$old_tasks" --argjson remaining "$remaining" '$old + $remaining | unique')
    done
    while IFS= read -r old_task; do
        aws ecs wait tasks-stopped --cluster "$name" --tasks "$old_task"
    done < <(jq -r '.[]' <<< "$old_tasks")
    aws ecs describe-services --cluster "$name" --services "$name" | \
        jq -e '.services[0] | .runningCount == 0 and .pendingCount == 0 and .desiredCount == 0' >/dev/null
fi
terraform -chdir="$root" apply -input=false -lock-timeout=5m -auto-approve keycloak.tfplan \
    >"$root/apply.log" 2>&1 || {
    printf 'Terraform apply failed; raw diagnostics withheld.\n' >&2; exit 1;
}
if [[ "$strategy" == recreate ]]; then
    # desired_count is ignored in ecs.tf. Never let the circuit breaker restart an
    # old image after a schema change; restore its setting only after health succeeds.
    aws ecs update-service --cluster "$name" --service "$name" --desired-count "$desired" \
        --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=false}' >/dev/null
fi
aws ecs wait services-stable --cluster "$name" --services "$name"
task=$(aws ecs describe-services --cluster "$name" --services "$name" --query 'services[0].taskDefinition' --output text)
actual=$(aws ecs describe-task-definition --task-definition "$task" \
    --query 'taskDefinition.containerDefinitions[?name==`keycloak`].image | [0]' --output text)
[[ "$actual" == "$TF_VAR_keycloak_image" ]] || { printf 'ECS rolled back or deployed an unexpected image.\n' >&2; exit 1; }
run_realm_build "$work/realm-build-id" "$name" "$release_sha"
hostname=auth.staging.learncard.app
if [[ "$DEPLOY_ENVIRONMENT" == production ]]; then hostname=auth.learncard.app; fi
healthy=false
for ((attempt=0; attempt<30; attempt++)); do
    code=$(curl --silent --show-error --connect-timeout 10 --max-time 20 -o /dev/null -w '%{http_code}' \
        "https://$hostname/realms/learncard/.well-known/openid-configuration") || code=000
    if [[ "$code" == 200 ]]; then healthy=true; break; fi
    sleep 10
done
[[ "$healthy" == true ]] || { printf 'Discovery smoke check failed.\n' >&2; exit 1; }
if [[ "$strategy" == recreate ]]; then
    aws ecs update-service --cluster "$name" --service "$name" \
        --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=true}' >/dev/null
    aws application-autoscaling register-scalable-target --service-namespace ecs \
        --resource-id "service/$name/$name" --scalable-dimension ecs:service:DesiredCount \
        --min-capacity "$minimum" --max-capacity "$maximum" --suspended-state "$suspended" >/dev/null
fi
# Reuse the exact checked config; do not reconstruct metadata from a mutable tag.
aws s3 cp "$work/metadata.json" "s3://$TF_STATE_BUCKET/$prefix/metadata.json" --only-show-errors
jq '.status = "complete"' "$work/deployment.json" >"$work/complete.json"
aws s3 cp "$work/complete.json" "s3://$TF_STATE_BUCKET/$prefix/deployment.json" --only-show-errors
complete=true
printf 'Deployed `%s` with `%s` strategy.\n' "$TF_VAR_keycloak_image" "$strategy" >>"${GITHUB_STEP_SUMMARY:-/dev/null}"
