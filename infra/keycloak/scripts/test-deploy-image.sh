#!/usr/bin/env bash
set -euo pipefail
# Offline deployment regression tests. Every external deployment tool is mocked.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin" "$work/repo/infra/keycloak/terraform/realm/"{environments,generated}
mkdir -p "$work/repo/infra/keycloak/scripts"
cp "$scripts/realm-runner.sh" "$work/repo/infra/keycloak/scripts/"
cp "$scripts/deploy-image.sh" "$work/deploy-image.sh"
cat >"$work/bin/aws" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$AWS_CALLS"
[[ ${FULL_DEPLOY:-false} == true ]] || exit 42
case "$1 $2" in
    's3api list-objects-v2') printf '{}\n' ;;
    's3 cp'|'ecs wait'|'rds create-db-cluster-snapshot'|'rds wait'|'application-autoscaling register-scalable-target') ;;
    'application-autoscaling describe-scalable-targets')
        printf '{"ScalableTargets":[{"MinCapacity":1,"MaxCapacity":2,"SuspendedState":{}}]}\n' ;;
    'ecs list-tasks') printf '[]\n' ;;
    'ecs update-service')
        if [[ "$*" == *'--desired-count 0'* ]]; then touch "$TEST_STATE/zero"
        elif [[ "$*" == *'--desired-count 1'* ]]; then rm -f "$TEST_STATE/zero"; fi ;;
    'ecs describe-services')
        if [[ "$*" == *--query* ]]; then printf 'offline-task\n'
        elif [[ -e "$TEST_STATE/zero" ]]; then printf '{"services":[{"desiredCount":0,"runningCount":0,"pendingCount":0}]}\n'
        else printf '{"services":[{"desiredCount":1}]}\n'; fi ;;
    'ecs describe-task-definition') printf '%s\n' "$TF_VAR_keycloak_image" ;;
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
    rm -f "$work/zero" "$work/stopping"
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

# Run the real deploy script through service apply, realm runner, smoke, and journal.
mkdir -p infra/keycloak/terraform/service
cat >infra/keycloak/scripts/terraform-plan.sh <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' '{"resource_changes":[{"address":"aws_ecs_task_definition.keycloak","change":{"after":{"container_definitions":"[{\"name\":\"keycloak\",\"environment\":[{\"name\":\"KC_DB\",\"value\":\"postgres\"}]}]"}}},{"address":"aws_appautoscaling_target.keycloak","change":{"actions":["no-op"]}}]}' >infra/keycloak/terraform/service/plan.json
MOCK
cat >infra/keycloak/scripts/compat-gate.sh <<'MOCK'
#!/usr/bin/env bash
printf 'strategy=%s\n' "$STRATEGY" >"$GITHUB_OUTPUT"
MOCK
cat >infra/keycloak/scripts/compat-metadata.sh <<'MOCK'
#!/usr/bin/env bash
printf '{}\n' >"$2"
MOCK
for tool in docker terraform sleep; do
    printf '#!/usr/bin/env bash\nexit 0\n' >"$work/bin/$tool"
done
cat >"$work/bin/curl" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$SMOKE_STATUS"
MOCK
chmod +x "$work/bin/"*
export FULL_DEPLOY=true TEST_STATE="$work"
for scenario in success discovery-404 realm-failure recreate-poll-error recreate-unknown-start; do
    prepare_inputs
    export BUILD_STATUS=SUCCEEDED SMOKE_STATUS=200 STRATEGY=rolling SCENARIO=$scenario
    case "$scenario" in
        discovery-404) export SMOKE_STATUS=404 ;;
        realm-failure) export BUILD_STATUS=FAILED ;;
        recreate-*) export STRATEGY=recreate ;;
    esac
    result=0
    bash "$work/deploy-image.sh" >"$work/log" 2>&1 || result=$?
    grep -q 'codebuild start-build.*--source-version image-sha' "$AWS_CALLS"
    if [[ "$scenario" == success ]]; then
        [[ "$result" == 0 ]] || { cat "$work/log"; exit 1; }
        grep -q '/complete.json ' "$AWS_CALLS"
    else
        [[ "$result" != 0 ]] || exit 1
        if grep -q '/complete.json ' "$AWS_CALLS"; then exit 1; fi
    fi
    case "$scenario" in
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
