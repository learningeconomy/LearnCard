#!/usr/bin/env bash
# Sourced by run-browser.sh and run-service.sh.

# Docker Hub intermittently answers manifest requests with 5xx or 429, and one failed
# pull while starting the stack fails the whole suite. Pull registry images first, with
# backoff. Only images of services without a `build` section that are not already on
# the runner are pulled: `docker compose pull --policy missing` cannot be used because
# Compose always re-pulls `:latest`, which would fetch the bake-built
# `learncard-monorepo-local` from Docker Hub. Run from the compose project directory.
e2e_compose_registry_images() {
    local image
    docker compose config --format json |
        jq -r '.services[] | select(.build == null) | .image // empty' |
        sort -u |
        while IFS= read -r image; do
            docker image inspect "$image" >/dev/null 2>&1 || printf '%s\n' "$image"
        done
}

e2e_pull_compose_images() {
    local attempt image max_attempts=4
    local -a pending=() failed=()
    while IFS= read -r image; do pending+=("$image"); done < <(e2e_compose_registry_images)
    for ((attempt = 1; ${#pending[@]} > 0; attempt++)); do
        failed=()
        for image in "${pending[@]}"; do
            docker pull --quiet "$image" >/dev/null || failed+=("$image")
        done
        ((${#failed[@]} == 0)) && return 0
        if ((attempt == max_attempts)); then
            echo "Image pull failed after ${max_attempts} attempts: ${failed[*]}" >&2
            return 1
        fi
        echo "::warning title=Image pull retry::${failed[*]} (attempt ${attempt}/${max_attempts}); retrying in $((attempt * 15))s" >&2
        sleep $((attempt * 15))
        pending=("${failed[@]}")
    done
    return 0
}
