#!/usr/bin/env bash
set -euo pipefail
# Use the same image/env/start options as compat-gate.sh and the ECS task.
image=${1:?Image required}
destination=${2:?Metadata output path required}
shift 2
directory=$(realpath "$(dirname "$destination")")
options=(run --rm)
if [[ -n ${KC_ENV_FILE:-} ]]; then options+=(--env-file "$KC_ENV_FILE"); fi
# The caller owns the directory; running with its uid avoids world-writable mounts.
docker "${options[@]}" --user "$(id -u):$(id -g)" \
    --mount "type=bind,src=$directory,dst=/work" \
    "$image" update-compatibility metadata --optimized --file="/work/$(basename "$destination")" \
    --db=postgres --cache=ispn --cache-stack=jdbc-ping "$@" >/dev/null
test -s "$destination"
