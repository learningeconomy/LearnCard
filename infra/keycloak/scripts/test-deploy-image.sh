#!/usr/bin/env bash
set -euo pipefail
# Offline deployment regression tests. Every external deployment tool is mocked.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin" "$work/repo/infra/keycloak/terraform/realm/"{environments,generated}
mkdir -p "$work/repo/infra/keycloak/scripts"
cp "$scripts/realm-runner.sh" "$work/repo/infra/keycloak/scripts/"
cp "$scripts/check-release-order.sh" "$work/repo/infra/keycloak/scripts/"
cp "$scripts/autoscaling-unchanged.jq" "$work/repo/infra/keycloak/scripts/"
cp "$scripts/deploy-image.sh" "$work/deploy-image.sh"
cat >"$work/bin/aws" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$AWS_CALLS"
[[ ${FULL_DEPLOY:-false} == true ]] || exit 42
case "$1 $2" in
    's3api list-objects-v2') printf '{}\n' ;;
    's3 cp')
        if [[ "$3" == *rolled-back.json ]]; then cp "$3" "$TEST_STATE/rolled-back.json"; fi ;;
    'ecs wait'|'rds create-db-cluster-snapshot'|'rds wait'|'application-autoscaling register-scalable-target') ;;
    'application-autoscaling describe-scalable-targets')
        printf '{"ScalableTargets":[{"MinCapacity":1,"MaxCapacity":2,"SuspendedState":{"DynamicScalingInSuspended":true,"DynamicScalingOutSuspended":false,"ScheduledScalingSuspended":false}}]}\n' ;;
    'ecs list-tasks') printf '[]\n' ;;
    'ecs update-service')
        if [[ "$*" == *'--desired-count 0'* ]]; then touch "$TEST_STATE/zero"
        elif [[ "$*" == *'--desired-count 1'* ]]; then rm -f "$TEST_STATE/zero"; fi ;;
    'ecs describe-services')
        if [[ "$*" == *--query* ]]; then printf 'offline-task\n'
        elif [[ -e "$TEST_STATE/zero" ]]; then printf '{"services":[{"desiredCount":0,"runningCount":0,"pendingCount":0}]}\n'
        else printf '{"services":[{"desiredCount":1,"taskDefinition":"old-task:3"}]}\n'; fi ;;
    'ecs describe-task-definition')
        if [[ "$*" == *'--include TAGS'* ]]; then
            printf '{"taskDefinition":{"taskDefinitionArn":"old-task:3","status":"ACTIVE","revision":3,"family":"learncard-keycloak-production","networkMode":"awsvpc","requiresCompatibilities":["FARGATE"],"cpu":"1024","memory":"2048","runtimePlatform":{"cpuArchitecture":"ARM64","operatingSystemFamily":"LINUX"},"containerDefinitions":[{"name":"keycloak","image":"old-image","secrets":[{"name":"SECRET","valueFrom":"secret-arn"}]}]},"tags":[{"key":"Project","value":"learncard-keycloak"}]}\n'
        elif [[ "$*" == *'--query taskDefinition.status'* ]]; then
            if [[ "$SCENARIO" == recreate-apply-active ]]; then printf 'ACTIVE\n'; else printf 'INACTIVE\n'; fi
        else printf '%s\n' "$TF_VAR_keycloak_image"; fi ;;
    'ecs register-task-definition')
        cp "${4#file://}" "$TEST_STATE/registered.json"
        [[ "$SCENARIO" != recreate-register-failure ]] || exit 44
        printf 'old-task:5\n' ;;
    'codebuild start-build')
        [[ "$SCENARIO" != recreate-unknown-start ]] || exit 43
        printf 'offline:build-id\n' ;;
    'codebuild stop-build') touch "$TEST_STATE/stopping" ;;
    'codebuild batch-get-builds')
        if [[ -e "$TEST_STATE/stopping" ]]; then
            printf 'terminal\n' >>"$AWS_CALLS"
            printf 'STOPPED\n'
        elif [[ "$SCENARIO" == recreate-poll-error ]]; then exit 43
        else printf '%s\n' "$BUILD_STATUS"; fi ;;
    *) exit 99 ;;
esac
MOCK
cat >"$work/bin/git" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == show && "$2" == "$RELEASE_SHA:"* ]] || exit 1
cat "$COMMITTED/${2#*:}"
MOCK
chmod +x "$work/bin/"*
export PATH="$work/bin:$PATH"
export AWS_CALLS="$work/aws-calls" COMMITTED="$work/committed"
export TF_STATE_BUCKET=offline GITHUB_SHA=main-sha RELEASE_SHA=image-sha
TF_VAR_keycloak_image="offline@sha256:$(printf '%064d' 0)"
export TF_VAR_keycloak_image
cd "$work/repo"

prepare_inputs() {
    local stage=production
    [[ "$DEPLOY_ENVIRONMENT" == production ]] || stage=keycloak-staging
    environment_file="infra/keycloak/terraform/realm/environments/$DEPLOY_ENVIRONMENT.tfvars"
    generated_file="infra/keycloak/terraform/realm/generated/$stage.tfvars.json"
    printf 'environment = "%s"\n' "$DEPLOY_ENVIRONMENT" >"$environment_file"
    printf '{}\n' >"$generated_file"
    mkdir -p "$COMMITTED/infra/keycloak/terraform/realm/"{environments,generated}
    cp "$environment_file" "$COMMITTED/$environment_file"
    cp "$generated_file" "$COMMITTED/$generated_file"
    : >"$AWS_CALLS"
    rm -f "$work/zero" "$work/stopping" "$work/registered.json" "$work/rolled-back.json"
}

reject_inputs() {
    local result=0
    bash "$work/deploy-image.sh" >"$work/log" 2>&1 || result=$?
    [[ "$result" == 1 && ! -s "$AWS_CALLS" ]]
    grep -F 'realm inputs are not committed:' "$work/log" >/dev/null
}

for environment in staging production; do
    export DEPLOY_ENVIRONMENT=$environment
    prepare_inputs
    rm "$environment_file"
    reject_inputs
    prepare_inputs
    : >"$generated_file"
    reject_inputs
    prepare_inputs
    rm "$COMMITTED/$generated_file"
    reject_inputs
    prepare_inputs
    printf 'uncommitted\n' >>"$generated_file"
    reject_inputs
    prepare_inputs
    result=0
    bash "$work/deploy-image.sh" >"$work/log" 2>&1 || result=$?
    [[ "$result" == 42 && -s "$AWS_CALLS" ]]
    printf 'PASS: %s preflight requires non-empty inputs committed at the image source SHA before AWS\n' "$environment"
done

# Recreate guard: tag-only scalable-target updates pass; sizing changes do not.
guard="$scripts/autoscaling-unchanged.jq"
target() { printf '{"resource_changes":[{"address":"aws_appautoscaling_target.keycloak","change":%s}]}' "$1"; }
sized='"min_capacity":1,"max_capacity":3'
target '{"actions":["no-op"]}' | jq -e -f "$guard" >/dev/null
target "{\"actions\":[\"update\"],\"before\":{$sized,\"tags\":{\"KeycloakVersion\":\"26.7.4\"}},\"after\":{$sized,\"tags\":{}},\"after_unknown\":{\"tags_all\":{}}}" | jq -e -f "$guard" >/dev/null
if target '{"actions":["update"],"before":{"min_capacity":1},"after":{"min_capacity":2},"after_unknown":{}}' | jq -e -f "$guard" >/dev/null; then exit 1; fi
if target '{"actions":["update"],"before":{"min_capacity":1},"after":{"min_capacity":1},"after_unknown":{"max_capacity":true}}' | jq -e -f "$guard" >/dev/null; then exit 1; fi
if target '{"actions":["delete","create"],"before":{},"after":{}}' | jq -e -f "$guard" >/dev/null; then exit 1; fi
printf 'PASS: recreate guard allows tag-only scalable-target updates and refuses sizing changes\n'

# Run the real deploy script through service apply, realm runner, smoke, and journal.
mkdir -p infra/keycloak/terraform/service
cat >infra/keycloak/scripts/terraform-plan.sh <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' '{"resource_changes":[{"address":"aws_ecs_task_definition.keycloak","change":{"after":{"container_definitions":"[{\"name\":\"keycloak\",\"environment\":[{\"name\":\"KC_DB\",\"value\":\"postgres\"},{\"name\":\"KC_BOOTSTRAP_ADMIN_USERNAME\",\"value\":\"bootstrap\"}]}]"}}},{"address":"aws_appautoscaling_target.keycloak","change":{"actions":["no-op"]}}]}' >infra/keycloak/terraform/service/plan.json
MOCK
cat >infra/keycloak/scripts/compat-gate.sh <<'MOCK'
#!/usr/bin/env bash
printf 'strategy=%s\n' "$STRATEGY" >"$GITHUB_OUTPUT"
MOCK
cat >infra/keycloak/scripts/compat-metadata.sh <<'MOCK'
#!/usr/bin/env bash
cp "$KC_ENV_FILE" "$TEST_STATE/runtime.env"
printf '{}\n' >"$2"
MOCK
for tool in docker sleep; do
    printf '#!/usr/bin/env bash\nexit 0\n' >"$work/bin/$tool"
done
cat >"$work/bin/terraform" <<'MOCK'
#!/usr/bin/env bash
printf 'terraform apply\n' >>"$AWS_CALLS"
case "$SCENARIO" in
    recreate-apply-*|recreate-register-failure|rolling-apply-failure)
        printf 'PRIVATE_TERRAFORM_DIAGNOSTIC\n'; exit 45 ;;
esac
MOCK
cat >"$work/bin/curl" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$SMOKE_STATUS"
MOCK
chmod +x "$work/bin/"*
export FULL_DEPLOY=true TEST_STATE="$work"
for scenario in success discovery-404 realm-failure recreate-poll-error recreate-unknown-start recreate-discovery-404 recreate-apply-failure recreate-apply-active recreate-register-failure rolling-apply-failure; do
    prepare_inputs
    export BUILD_STATUS=SUCCEEDED SMOKE_STATUS=200 STRATEGY=rolling SCENARIO=$scenario
    case "$scenario" in
        discovery-404) export SMOKE_STATUS=404 ;;
        realm-failure) export BUILD_STATUS=FAILED ;;
        recreate-*) export STRATEGY=recreate ;;
    esac
    if [[ "$scenario" == recreate-discovery-404 ]]; then export SMOKE_STATUS=404; fi
    result=0
    bash "$work/deploy-image.sh" >"$work/log" 2>&1 || result=$?
    case "$scenario" in
        recreate-apply-*|recreate-register-failure|rolling-apply-failure)
            if grep -q 'codebuild start-build' "$AWS_CALLS"; then exit 1; fi ;;
        *) grep -q 'codebuild start-build.*--source-version image-sha' "$AWS_CALLS" ;;
    esac
    if [[ "$scenario" == success ]]; then
        [[ "$result" == 0 ]] || { cat "$work/log"; exit 1; }
        # Keycloak refuses a bootstrap username without its (secret) password.
        grep -qx 'KC_DB=postgres' "$TEST_STATE/runtime.env"
        if grep -q '^KC_BOOTSTRAP_ADMIN_' "$TEST_STATE/runtime.env"; then exit 1; fi
        grep -q '/complete.json ' "$AWS_CALLS"
    else
        [[ "$result" != 0 ]] || exit 1
        if grep -q '/complete.json ' "$AWS_CALLS"; then exit 1; fi
    fi
    case "$scenario" in
        recreate-apply-failure|recreate-apply-active)
            expected_task=old-task:5
            if [[ "$scenario" == recreate-apply-active ]]; then
                expected_task=old-task:3
                [[ ! -e "$TEST_STATE/registered.json" ]]
            else
                jq -e '.family == "learncard-keycloak-production" and .tags == [{key:"Project",value:"learncard-keycloak"}] and
                    .containerDefinitions[0].secrets[0].valueFrom == "secret-arn" and
                    .runtimePlatform.cpuArchitecture == "ARM64" and (has("status") or has("revision") or has("taskDefinitionArn") | not)' "$TEST_STATE/registered.json" >/dev/null
            fi
            grep -q "ecs update-service.*--task-definition $expected_task --desired-count 1" "$AWS_CALLS"
            grep -q 'register-scalable-target.*--min-capacity 1 --max-capacity 2 --suspended-state {"DynamicScalingInSuspended":true,"DynamicScalingOutSuspended":false,"ScheduledScalingSuspended":false}' "$AWS_CALLS"
            jq -e '. == {status:"rolled_back",image:"old-image",sha:"image-sha",strategy:"recreate",reason:"apply failed before start"}' "$TEST_STATE/rolled-back.json" >/dev/null
            [[ ! -e "$TEST_STATE/zero" ]]
            capture=$(grep -n 'describe-task-definition.*--include TAGS' "$AWS_CALLS" | cut -d: -f1)
            stop=$(grep -n 'ecs update-service.*--desired-count 0' "$AWS_CALLS" | cut -d: -f1)
            apply=$(grep -n '^terraform apply$' "$AWS_CALLS" | cut -d: -f1)
            restore=$(grep -n 'ecs update-service.*--task-definition' "$AWS_CALLS" | cut -d: -f1)
            [[ "$capture" -lt "$stop" && "$stop" -lt "$apply" && "$apply" -lt "$restore" ]]
            grep -q 'restored previous task definition and capacity' "$work/log" ;;
        recreate-register-failure|recreate-discovery-404)
            [[ -e "$TEST_STATE/zero" && ! -e "$TEST_STATE/rolled-back.json" ]]
            grep -q 'register-scalable-target.*--min-capacity 0.*DynamicScalingInSuspended=true,DynamicScalingOutSuspended=true,ScheduledScalingSuspended=true' "$AWS_CALLS"
            if grep -q 'ecs update-service.*--task-definition' "$AWS_CALLS"; then exit 1; fi
            if [[ "$scenario" == recreate-discovery-404 ]]; then
                if grep -q 'ecs register-task-definition' "$AWS_CALLS"; then exit 1; fi
            else
                grep -q 'Pre-start recovery failed' "$work/log"
            fi ;;
        rolling-apply-failure)
            if grep -q 'ecs update-service\|ecs register-task-definition\|register-scalable-target' "$AWS_CALLS"; then exit 1; fi ;;
        recreate-poll-error)
            # The real deployment EXIT trap must confirm terminal before stopping ECS.
            grep -q '^terminal$' "$AWS_CALLS"
            [[ $(tail -n 1 "$AWS_CALLS") == 'ecs update-service '*'--desired-count 0' ]] || exit 1
            [[ -e "$TEST_STATE/zero" ]] || exit 1 ;;
        recreate-unknown-start)
            grep -q 'start outcome unknown' "$work/log"
            [[ ! -e "$TEST_STATE/zero" ]] || exit 1 ;;
    esac
    printf 'PASS: deployment %s requires successful realm apply and discovery HTTP 200\n' "$scenario"
done
