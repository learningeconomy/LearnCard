#!/usr/bin/env bash
set -euo pipefail
# Resolve metadata only: never retrieve a password or read Terraform state.
# The protected workflow calls this before publishing images or planning service changes.
fail() { printf '::error::%s\n' "$1" >&2; exit 1; }
case "${DEPLOY_ENVIRONMENT:-}" in
    staging) account=281762601323 ;;
    production) account=206533012615 ;;
    *) fail 'Bootstrap secret resolution requires staging or production.' ;;
esac
[[ ${AWS_REGION:-} == us-east-1 ]] || fail 'Keycloak bootstrap secrets must use us-east-1.'
: "${GITHUB_ENV:?GitHub environment output required}"
name="learncard-keycloak-$DEPLOY_ENVIRONMENT"
configuration="Set KEYCLOAK_BOOTSTRAP_ADMIN_SECRET_ARN in the keycloak-$DEPLOY_ENVIRONMENT GitHub environment to the existing same-account, us-east-1 secret ARN under learncard-keycloak/$DEPLOY_ENVIRONMENT/ (not its password). See infra/keycloak/terraform/README.md."
arn=${TF_VAR_bootstrap_admin_password_secret_arn:-}
if [[ -z "$arn" ]]; then
    # Match the drift workflow: preserve the exact reference used by the service,
    # including custom secret names. Do not fabricate Secrets Manager ARN suffixes.
    service=$(aws ecs describe-services --region "$AWS_REGION" --no-cli-pager \
        --cluster "$name" --services "$name" --output json 2>/dev/null) || \
        fail "Cannot read the existing Keycloak service metadata. Check deploy-role ECS read access. $configuration"
    task=$(jq -er --arg name "$name" '
        select(((.failures // []) | length) == 0) |
        .services | select(length == 1) | .[0] |
        select(.serviceName == $name and .status == "ACTIVE") | .taskDefinition
    ' <<< "$service" 2>/dev/null) || \
        fail "No unambiguous active Keycloak service reference is available. $configuration"
    [[ "$task" =~ ^arn:aws:ecs:us-east-1:$account:task-definition/$name:[0-9]+$ ]] || \
        fail "The existing task definition is outside the expected Keycloak account or family. $configuration"
    definition=$(aws ecs describe-task-definition --region "$AWS_REGION" --no-cli-pager \
        --task-definition "$task" --output json 2>/dev/null) || \
        fail "Cannot read the existing Keycloak task-definition metadata. Check deploy-role ECS read access. $configuration"
    arn=$(jq -er --arg task "$task" '
        .taskDefinition | select(.taskDefinitionArn == $task) |
        [.containerDefinitions[] | select(.name == "keycloak")] |
        select(length == 1) | .[0] |
        [.secrets[]? | select(.name == "KC_BOOTSTRAP_ADMIN_PASSWORD")] |
        select(length == 1) | .[0].valueFrom | select(type == "string") |
        select(test("[\r\n]") | not)
    ' <<< "$definition" 2>/dev/null) || \
        fail "No unambiguous bootstrap secret reference exists in the Keycloak task definition. $configuration"
fi
# A plain secret ARN only: reject other accounts/regions/environments, ECS JSON-key
# selectors, whitespace and newlines before writing a runner environment file.
[[ "$arn" =~ ^arn:aws:secretsmanager:us-east-1:$account:secret:learncard-keycloak/$DEPLOY_ENVIRONMENT/[A-Za-z0-9/_+=.@-]+$ ]] || \
    fail "Invalid Keycloak bootstrap secret ARN. $configuration"
printf 'TF_VAR_bootstrap_admin_password_secret_arn=%s\n' "$arn" >> "$GITHUB_ENV"
printf 'Validated the Keycloak bootstrap secret reference; no secret value was read.\n'
