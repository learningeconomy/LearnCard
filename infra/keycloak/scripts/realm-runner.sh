#!/usr/bin/env bash
# Sourced by deploy-image.sh; status only, never build logs or environment values.
realm_build=
realm_finished=false

realm_build_status() {
    AWS_MAX_ATTEMPTS=1 aws codebuild batch-get-builds --ids "$realm_build" \
        --query 'builds[0].buildStatus' --output text \
        --cli-connect-timeout 5 --cli-read-timeout 10 2>/dev/null
}

run_realm_build() {
    local id_file=$1 name=$2 release_sha=$3 deadline status
    # Write directly so the EXIT trap can recover the ID even on interruption.
    aws codebuild start-build --project-name "$name-realm" --source-version "$release_sha" \
        --query build.id --output text >"$id_file"
    realm_build=$(<"$id_file")
    [[ -n "$realm_build" && "$realm_build" != None ]] || return 1
    printf 'Realm runner started: %s\n' "$realm_build"
    # realm-runner.tf permits 30m queued + 30m building; add 5m margin.
    deadline=$(( $(date +%s) + 65 * 60 ))
    while (( $(date +%s) < deadline )); do
        status=$(realm_build_status) || return 1
        case "$status" in
            SUCCEEDED) realm_finished=true; return 0 ;;
            FAILED|FAULT|STOPPED|TIMED_OUT)
                realm_finished=true
                printf 'Realm runner failed: %s (%s). Inspect restricted CodeBuild logs.\n' "$realm_build" "$status" >&2
                return 1 ;;
            IN_PROGRESS) sleep 15 ;;
            *) printf 'Realm runner status unavailable: %s\n' "$realm_build" >&2; return 1 ;;
        esac
    done
    printf 'Realm runner timed out: %s\n' "$realm_build" >&2
    return 1
}

stop_realm_build() {
    local id_file=$1 deadline status
    if [[ -z "$realm_build" && -s "$id_file" ]]; then realm_build=$(<"$id_file"); fi
    [[ -n "$realm_build" && "$realm_build" != None && "$realm_finished" != true ]] || return 0
    printf 'Stopping unfinished realm runner: %s\n' "$realm_build" >&2
    deadline=$(( $(date +%s) + 5 * 60 ))
    AWS_MAX_ATTEMPTS=1 aws codebuild stop-build --id "$realm_build" \
        --cli-connect-timeout 5 --cli-read-timeout 10 >/dev/null 2>&1 || \
        printf 'Realm runner stop request failed; checking for terminal status.\n' >&2
    while (( $(date +%s) < deadline )); do
        status=$(realm_build_status) || status=UNKNOWN
        case "$status" in
            SUCCEEDED|FAILED|FAULT|STOPPED|TIMED_OUT)
                realm_finished=true
                printf 'Realm runner terminal: %s (%s)\n' "$realm_build" "$status" >&2
                return 0 ;;
        esac
        sleep 15
    done
    printf '::error::Realm build %s may still be running; terminal status not confirmed within 5 minutes. Service cleanup withheld; operator intervention required.\n' "$realm_build" >&2
    return 1
}
