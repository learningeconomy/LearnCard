#!/usr/bin/env bash
set -euo pipefail

# Run from the repository root, against a local fixture realm only.
for tool in docker jq; do
    command -v "$tool" >/dev/null 2>&1 || { printf 'Required tool missing: %s\n' "$tool" >&2; exit 1; }
done

compose_file=${1:-apps/learn-card-app/compose-local.yaml}
realm_dir="$PWD/infra/keycloak/realms"
[[ -d "$realm_dir" ]] || { printf 'Run from the repository root.\n' >&2; exit 1; }
export_file="$realm_dir/.learncard-export.tmp.json"
normalized_file="$realm_dir/.learncard-normalized.tmp.json"
stopped=false
cleanup() {
    if "$stopped"; then docker compose -f "$compose_file" start keycloak; fi
    rm -f "$export_file" "$normalized_file"
}
trap cleanup EXIT

docker compose -f "$compose_file" stop keycloak
stopped=true
docker compose -f "$compose_file" run --rm --no-deps \
    -v "$realm_dir:/export" keycloak export --realm learncard \
    --file /export/.learncard-export.tmp.json --users realm_file
docker compose -f "$compose_file" start keycloak
stopped=false

jq -eS '
    # Fail closed if a fixture client was removed, renamed, or duplicated.
    if ([.clients[] | select(.clientId == "lca-api")] | length) != 1
        or ([.clients[] | select(.clientId == "ci-tests")] | length) != 1
    then error("Expected exactly one lca-api client and one ci-tests client")
    else . end
    | walk(if type == "object" then del(.id, .containerId) else . end)
    | del(.authenticationFlows, .authenticatorConfig, .keycloakVersion)
    | .users |= map(
        del(.createdTimestamp)
        | .credentials = [{type: "password", value: "password", temporary: false}]
      )
    | .clients |= map(
        if .clientId == "lca-api" then .secret = "dev-only-secret"
        elif .clientId == "ci-tests" then .secret = "ci-tests-dev-only-secret"
        elif has("secret") then error("Unexpected client secret in fixture export")
        else . end
      )
' "$export_file" > "$normalized_file"
mv "$normalized_file" "$realm_dir/learncard-dev-realm.json"
