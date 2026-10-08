#!/usr/bin/env bash
set -euo pipefail
# Read-only preflight, also run before publishing push images. The deployment job
# concurrency lock must cover this check through the final journal write.
: "${DEPLOY_ENVIRONMENT:?}"
: "${TF_STATE_BUCKET:?}"
: "${GITHUB_SHA:?}"
[[ "$DEPLOY_ENVIRONMENT" == staging || "$DEPLOY_ENVIRONMENT" == production ]]
candidate=${RELEASE_SHA:-$GITHUB_SHA}
allow_rollback=${ALLOW_ROLLBACK:-false}
if [[ "$allow_rollback" != false && "$allow_rollback" != true ]]; then
    printf 'ALLOW_ROLLBACK must be true or false.\n' >&2; exit 1
fi
if [[ "$allow_rollback" == true && ${GITHUB_EVENT_NAME:-} != workflow_dispatch ]]; then
    printf 'Rollback override is only allowed on workflow_dispatch.\n' >&2; exit 1
fi
umask 077
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
key="keycloak/$DEPLOY_ENVIRONMENT/compat/deployment.json"
# Distinguish a first deployment from access/network failures; never fail open.
count=$(aws s3api list-objects-v2 --bucket "$TF_STATE_BUCKET" --prefix "$key" --output json | \
    jq --arg key "$key" '[.Contents[]? | select(.Key == $key)] | length')
if [[ "$count" == 0 ]]; then
    printf 'No deployment journal; allowing first deployment.\n'
    exit 0
fi
[[ "$count" == 1 ]] || { printf 'Unexpected deployment journal listing.\n' >&2; exit 1; }
aws s3api get-object --bucket "$TF_STATE_BUCKET" --key "$key" "$work/deployment.json" >/dev/null
jq -e '.status == "complete"' "$work/deployment.json" >/dev/null || {
    printf 'Prior deployment pending, rolled_back, or invalid; verify the running image and source SHA, reconcile Terraform and compatibility metadata, then write deployment.json as complete with that image/SHA before retrying.\n' >&2; exit 1;
}
previous=$(jq -er '.sha | select(type == "string") | select(test("^[0-9a-f]{40}$"))' "$work/deployment.json") || {
    printf 'Invalid prior release SHA in deployment journal; refusing deployment.\n' >&2; exit 1;
}
[[ "$candidate" =~ ^[0-9a-f]{40}$ ]] || { printf 'Invalid candidate release SHA.\n' >&2; exit 1; }
if [[ "$allow_rollback" == true ]]; then
    printf '::warning::Deliberate rollback override: %s -> %s; compatibility checks still apply.\n' "$previous" "$candidate"
elif ! GIT_MASTER=1 git merge-base --is-ancestor "$previous" "$candidate"; then
    printf 'Refusing deployment: candidate %s is not the same as or a descendant of deployed release %s (or history is unavailable). Use workflow_dispatch allow_rollback only for a deliberate rollback.\n' "$candidate" "$previous" >&2
    exit 1
fi
