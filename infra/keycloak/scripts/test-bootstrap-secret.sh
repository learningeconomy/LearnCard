#!/usr/bin/env bash
set -euo pipefail
# Offline only: every AWS call is intercepted; fixtures contain synthetic metadata.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin"
cat > "$work/bin/aws" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$AWS_CALLS"
case "$1 $2" in
    'ecs describe-services')
        [[ "$API_FAILURE" != service ]] || { echo RAW_DIAGNOSTIC_CANARY >&2; exit 42; }
        cat "$FIXTURES/service.json" ;;
    'ecs describe-task-definition')
        [[ "$API_FAILURE" != task ]] || { echo RAW_DIAGNOSTIC_CANARY >&2; exit 43; }
        cat "$FIXTURES/task.json" ;;
    *) echo 'Unexpected AWS call' >&2; exit 99 ;;
esac
MOCK
chmod +x "$work/bin/aws"
export PATH="$work/bin:$PATH" FIXTURES="$work" AWS_CALLS="$work/calls" GITHUB_ENV="$work/env"
export AWS_REGION=us-east-1 API_FAILURE=''
cases=0
prepare() {
    export DEPLOY_ENVIRONMENT=${1:-staging} TF_VAR_bootstrap_admin_password_secret_arn=''
    export API_FAILURE='' AWS_REGION=us-east-1
    account=281762601323
    [[ "$DEPLOY_ENVIRONMENT" != production ]] || account=206533012615
    name="learncard-keycloak-$DEPLOY_ENVIRONMENT"
    task="arn:aws:ecs:us-east-1:$account:task-definition/$name:7"
    arn="arn:aws:secretsmanager:us-east-1:$account:secret:learncard-keycloak/$DEPLOY_ENVIRONMENT/custom/admin-AbCdEf"
    jq -n --arg name "$name" --arg task "$task" \
        '{services:[{serviceName:$name,status:"ACTIVE",taskDefinition:$task}],failures:[]}' > "$work/service.json"
    jq -n --arg task "$task" --arg arn "$arn" \
        '{taskDefinition:{taskDefinitionArn:$task,containerDefinitions:[{name:"keycloak",secrets:[{name:"KC_BOOTSTRAP_ADMIN_PASSWORD",valueFrom:$arn}]}]}}' > "$work/task.json"
    : > "$AWS_CALLS"
    : > "$GITHUB_ENV"
}
mutate() {
    jq "$2" "$work/$1.json" > "$work/changed.json"
    mv "$work/changed.json" "$work/$1.json"
}
run() {
    local result=0
    bash "$scripts/resolve-bootstrap-secret.sh" > "$work/log" 2>&1 || result=$?
    if [[ "$1" == pass ]]; then
        [[ "$result" == 0 ]] || { cat "$work/log"; exit 1; }
        [[ $(cat "$GITHUB_ENV") == "TF_VAR_bootstrap_admin_password_secret_arn=$arn" ]]
    else
        [[ "$result" != 0 && ! -s "$GITHUB_ENV" ]]
        grep -q '::error::' "$work/log"
    fi
    # Logs must never contain raw API diagnostics or the resolved/configured ARN.
    if grep -Eq 'RAW_DIAGNOSTIC_CANARY|arn:aws:|get-secret-value|SecretString' "$work/log"; then
        echo 'Unexpected raw diagnostic or secret reference in logs' >&2
        exit 1
    fi
    if grep -Ev '^ecs describe-(services|task-definition) ' "$AWS_CALLS"; then
        echo 'Unexpected AWS call' >&2
        exit 1
    fi
    cases=$((cases + 1))
}
for environment in staging production; do
    prepare "$environment"
    run pass
    [[ $(wc -l < "$AWS_CALLS") == 2 ]]
    grep -F -- "--cluster $name --services $name" "$AWS_CALLS" >/dev/null
    grep -F -- "--task-definition $task" "$AWS_CALLS" >/dev/null
    prepare "$environment"
    export TF_VAR_bootstrap_admin_password_secret_arn="$arn" API_FAILURE=service
    run pass
    [[ ! -s "$AWS_CALLS" ]] # The configured override takes precedence, without AWS reads.
done
for value in ' ' 'not-an-arn' \
    'arn:aws:secretsmanager:us-west-2:281762601323:secret:learncard-keycloak/staging/admin-AbCdEf' \
    'arn:aws:secretsmanager:us-east-1:206533012615:secret:learncard-keycloak/staging/admin-AbCdEf' \
    'arn:aws:secretsmanager:us-east-1:281762601323:secret:learncard-keycloak/production/admin-AbCdEf' \
    'arn:aws:secretsmanager:us-east-1:281762601323:secret:other/staging/admin-AbCdEf' \
    'arn:aws:secretsmanager:us-east-1:281762601323:secret:learncard-keycloak/staging/admin-AbCdEf:password::' \
    $'arn:aws:secretsmanager:us-east-1:281762601323:secret:learncard-keycloak/staging/admin-AbCdEf\nINJECTED=value' \
    $'arn:aws:secretsmanager:us-east-1:281762601323:secret:learncard-keycloak/staging/admin-AbCdEf\n'; do
    prepare
    export TF_VAR_bootstrap_admin_password_secret_arn="$value"
    run fail
    [[ ! -s "$AWS_CALLS" ]] # Invalid explicit configuration never silently falls back.
    prepare
    jq --arg value "$value" '.taskDefinition.containerDefinitions[0].secrets[0].valueFrom = $value' \
        "$work/task.json" > "$work/changed.json"
    mv "$work/changed.json" "$work/task.json"
    run fail
done
for failure in service task; do
    prepare
    export API_FAILURE="$failure"
    run fail
done
for filter in '.failures = [{reason:"MISSING"}]' '.services = []' \
    '.services += .services' '.services[0].status = "DRAINING"' \
    '.services[0].serviceName = "other-service"' '.services[0].taskDefinition = null' \
    '.services[0].taskDefinition |= sub("281762601323";"206533012615")' \
    '.services[0].taskDefinition |= sub("learncard-keycloak-staging";"other-family")'; do
    prepare
    mutate service "$filter"
    run fail
    [[ $(wc -l < "$AWS_CALLS") == 1 ]]
done
for filter in '.taskDefinition.taskDefinitionArn += "0"' \
    '.taskDefinition.containerDefinitions = []' \
    '.taskDefinition.containerDefinitions += .taskDefinition.containerDefinitions' \
    '.taskDefinition.containerDefinitions[0].secrets = []' \
    '.taskDefinition.containerDefinitions[0].secrets += .taskDefinition.containerDefinitions[0].secrets' \
    '.taskDefinition.containerDefinitions[0].secrets[0].valueFrom = null'; do
    prepare
    mutate task "$filter"
    run fail
done
for response in service task; do
    prepare
    printf 'malformed JSON\n' > "$work/$response.json"
    run fail
done
prepare
export DEPLOY_ENVIRONMENT=unknown
run fail
[[ ! -s "$AWS_CALLS" ]]
prepare
export AWS_REGION=us-west-2
run fail
[[ ! -s "$AWS_CALLS" ]]
printf 'PASS: %s bootstrap secret configuration/discovery cases; no live AWS calls\n' "$cases"
