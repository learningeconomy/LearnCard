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

jq -S '
    walk(if type == "object" then del(.id, .containerId) else . end)
    | del(.authenticationFlows, .authenticatorConfig, .keycloakVersion)
    | .users |= map(
        del(.createdTimestamp)
        | .credentials = [{type: "password", value: "password", temporary: false}]
      )
    | (.clients[] | select(.clientId == "lca-api").secret) = "dev-only-secret"
    | (.clients[] | select(.clientId == "ci-tests").secret) = "ci-tests-dev-only-secret"
' "$export_file" > "$normalized_file"
mv "$normalized_file" "$realm_dir/learncard-dev-realm.json"
