#!/usr/bin/env bash
# Run an external command within an absolute wall-clock deadline, not just socket
# inactivity timeouts. Used for diagnostics and recovery; callers redirect output.
run_before_deadline() {
    local deadline=$1 pid
    shift
    (( $(date +%s) < deadline )) || return 1
    "$@" &
    pid=$!
    while kill -0 "$pid" 2>/dev/null; do
        if (( $(date +%s) >= deadline )); then
            kill "$pid" 2>/dev/null || true
            sleep 1
            kill -KILL "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
            return 1
        fi
        sleep 1
    done
    wait "$pid"
}

# Source this helper; call only after failure, before deleting the raw log.
# Always succeeds so diagnostics cannot replace the original failure status.
upload_private_diagnostics() (
    set +x
    local phase=${1:-} log_file=${2:-} key deadline
    case "$phase" in apply|plan) ;; *) return 0 ;; esac
    case "${DEPLOY_ENVIRONMENT:-}" in staging|production) ;; *) return 0 ;; esac
    [[ ${TF_STATE_BUCKET:-} =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]] || return 0
    [[ ${GITHUB_RUN_ID:-} =~ ^[0-9]+$ && ${GITHUB_RUN_ATTEMPT:-} =~ ^[0-9]+$ ]] || return 0
    [[ -f "$log_file" && -r "$log_file" ]] || return 0
    key="keycloak/$DEPLOY_ENVIRONMENT/diagnostics/$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT/$phase.log"
    deadline=$(( $(date +%s) + 30 ))
    # A stopped deploy needs its recovery/fallback reserve more than an upload.
    if [[ ${DEPLOY_DEADLINE_EPOCH:-} =~ ^[0-9]+$ ]] && (( deadline > DEPLOY_DEADLINE_EPOCH - 660 )); then
        deadline=$(( DEPLOY_DEADLINE_EPOCH - 660 ))
    fi

    # SSE-S3 matches bootstrap/state.tf. No ACLs, reads, lists or multipart grants.
    # Suppress both streams: AWS error messages may contain sensitive data.
    if run_before_deadline "$deadline" env AWS_MAX_ATTEMPTS=2 AWS_PAGER='' aws s3api put-object \
        --bucket "$TF_STATE_BUCKET" \
        --key "$key" \
        --body "$log_file" \
        --server-side-encryption AES256 \
        --cli-connect-timeout 10 --cli-read-timeout 30 \
        >/dev/null 2>&1; then
        printf 'Private diagnostics: s3://%s/%s\n' "$TF_STATE_BUCKET" "$key" >&2
    else
        printf 'Private diagnostics upload unavailable: s3://%s/%s\n' "$TF_STATE_BUCKET" "$key" >&2
    fi
    return 0
)
