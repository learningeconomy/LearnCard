#!/usr/bin/env bash
set -euo pipefail
# Usage: bash compat-gate.sh PREVIOUS_JSON IMAGE [start options...]
# PREVIOUS_JSON may be absent ONLY for a confirmed first deployment.
# https://github.com/keycloak/keycloak/blob/26.7.4/docs/guides/server/update-compatibility.adoc
previous=${1:?Previous metadata path required}
image=${2:?New image required}
shift 2
strategy=recreate
if [[ -e "$previous" ]]; then
    previous=$(realpath "$previous")
    options=()
    if [[ -n ${KC_ENV_FILE:-} ]]; then options+=(--env-file "$KC_ENV_FILE"); fi
    status=0
    docker run --rm "${options[@]}" --mount "type=bind,src=$previous,dst=/work/prev.json,readonly" \
        "$image" update-compatibility check --optimized --file=/work/prev.json \
        --db=postgres --cache=ispn --cache-stack=jdbc-ping "$@" || status=$?
    case "$status" in
        0) strategy=rolling ;;
        3|4) strategy=recreate ;;
        *) printf 'Compatibility check failed (exit %s); refusing deployment.\n' "$status" >&2; exit "$status" ;;
    esac
    printf 'compatibility_exit_code=%s\n' "$status"
else
    printf 'No previous metadata: first deployment requires recreate.\n'
fi
printf 'strategy=%s\n' "$strategy"
if [[ -n ${GITHUB_OUTPUT:-} ]]; then printf 'strategy=%s\n' "$strategy" >> "$GITHUB_OUTPUT"; fi
