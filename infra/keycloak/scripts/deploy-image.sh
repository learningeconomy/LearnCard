#!/usr/bin/env bash
# shellcheck disable=SC2016 # Literal Markdown and JMESPath backticks, not substitutions.
set -euo pipefail
# AWS calls occur only in the protected environment job, never in local validation.
: "${DEPLOY_ENVIRONMENT:?}"
: "${TF_STATE_BUCKET:?}"
: "${TF_VAR_keycloak_image:?}"
: "${GITHUB_SHA:?}"
[[ "$DEPLOY_ENVIRONMENT" == staging || "$DEPLOY_ENVIRONMENT" == production ]]
[[ "$TF_VAR_keycloak_image" =~ @sha256:[0-9a-f]{64}$ ]]
scripts="$PWD/infra/keycloak/scripts"
root=infra/keycloak/terraform/service
name="learncard-keycloak-$DEPLOY_ENVIRONMENT"
prefix="keycloak/$DEPLOY_ENVIRONMENT/compat"
umask 077
work=$(mktemp -d)
stopped=false
complete=false
cleanup() {
    if [[ "$stopped" == true && "$complete" != true ]]; then
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
}
trap cleanup EXIT
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
jq -n --arg image "$TF_VAR_keycloak_image" --arg sha "$GITHUB_SHA" --arg strategy "$strategy" \
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
realm_applied=false
if [[ -d infra/keycloak/terraform/realm ]]; then
    build=$(aws codebuild start-build --project-name "$name-realm" --source-version "$GITHUB_SHA" --query build.id --output text)
    for ((attempt=0; attempt<120; attempt++)); do
        status=$(aws codebuild batch-get-builds --ids "$build" --query 'builds[0].buildStatus' --output text)
        case "$status" in
            SUCCEEDED) realm_applied=true; break ;;
            IN_PROGRESS) sleep 15 ;;
            *) printf 'Realm runner failed: %s (%s). Inspect restricted CodeBuild logs.\n' "$build" "$status" >&2; exit 1 ;;
        esac
    done
    [[ "$realm_applied" == true ]] || { printf 'Realm runner timed out.\n' >&2; exit 1; }
else
    printf '::warning::Realm root absent; skipping the private realm runner.\n'
fi
hostname=auth.staging.learncard.app
if [[ "$DEPLOY_ENVIRONMENT" == production ]]; then hostname=auth.learncard.app; fi
healthy=false
for ((attempt=0; attempt<30; attempt++)); do
    code=$(curl --silent --show-error --connect-timeout 10 --max-time 20 -o /dev/null -w '%{http_code}' \
        "https://$hostname/realms/learncard/.well-known/openid-configuration") || code=000
    if [[ "$code" == 200 ]]; then healthy=true; break; fi
    if [[ "$code" == 404 && "$realm_applied" == false && ${ALLOW_MISSING_REALM:-false} == true ]]; then
        printf '::warning::Explicit bootstrap exception: realm is not applied; discovery returned 404.\n'
        healthy=true; break
    fi
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
