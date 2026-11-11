#!/usr/bin/env bash
set -Eeuo pipefail

# Catalog jobs use an isolated GitHub-hosted runner. Match the E2E runner's
# unused toolchain allowlist, but leave Docker images, builders and mounts alone.
readonly phase="${1:-}"
readonly minimum_input="${2:-}"
case "$phase" in
    before-setup|before-preflight) ;;
    *) echo 'Invalid verification storage phase' >&2; exit 2 ;;
esac
if [[ ! "$minimum_input" =~ ^[0-9]{1,12}$ ]]; then
    echo 'Invalid verification storage threshold' >&2
    exit 2
fi
readonly minimum_kib=$((10#$minimum_input))
readonly workspace_path="${GITHUB_WORKSPACE:-.}/apps/learn-card-app"
readonly -a reclaim_paths=(
    /usr/local/lib/android
    /usr/share/dotnet
    /opt/ghc
    /usr/local/.ghcup
    /opt/hostedtoolcache/CodeQL
    /usr/local/share/boost
    /usr/share/swift
    /usr/local/share/powershell
)

available_kib() {
    local value
    value="$(df -Pk "$workspace_path" | awk 'NR == 2 { print $4 }')"
    if [[ ! "$value" =~ ^[0-9]{1,12}$ ]]; then
        echo 'Unable to measure verification workspace disk space' >&2
        return 1
    fi
    printf '%s\n' "$((10#$value))"
}

before_kib="$(available_kib)"
decision=not-needed
if (( before_kib < minimum_kib )); then
    if [[ "${RUNNER_ENVIRONMENT:-}" == github-hosted ]]; then
        decision=performed
        failed=0
        pids=()
        for path in "${reclaim_paths[@]}"; do
            sudo rm -rf -- "$path" &
            pids+=("$!")
        done
        for pid in "${pids[@]}"; do
            wait "$pid" || failed=1
        done
        if (( failed )); then
            echo 'Some verification runner cleanup commands failed; using measured capacity' >&2
        fi
    else
        decision=skipped-non-hosted
    fi
fi

after_kib="$(available_kib)"
printf 'verification_storage phase=%s before_kib=%s after_kib=%s minimum_kib=%s reclaim=%s\n' \
    "$phase" "$before_kib" "$after_kib" "$minimum_kib" "$decision"
