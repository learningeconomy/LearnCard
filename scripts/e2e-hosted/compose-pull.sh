#!/usr/bin/env bash
# Sourced by run-browser.sh and run-service.sh.

# Docker Hub intermittently answers manifest requests with 5xx or 429, and one failed
# pull while starting the stack fails the whole suite. Pull registry images first, with
# backoff. Locally built (bake) images already exist, so `--policy missing` and
# `--ignore-buildable` skip them. Run from the compose project directory.
e2e_pull_compose_images() {
    local attempt max_attempts=4
    for ((attempt = 1; attempt <= max_attempts; attempt++)); do
        if docker compose pull --policy missing --ignore-buildable --quiet; then
            return 0
        fi
        if ((attempt < max_attempts)); then
            echo "::warning title=Image pull retry::docker compose pull failed (attempt ${attempt}/${max_attempts}); retrying in $((attempt * 15))s" >&2
            sleep $((attempt * 15))
        fi
    done
    echo "docker compose pull failed after ${max_attempts} attempts" >&2
    return 1
}
