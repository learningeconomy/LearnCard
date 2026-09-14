#!/usr/bin/env bash

e2e_now_utc() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }
e2e_now_epoch() { date +%s; }

e2e_metrics_init() {
    local job_name="${1:?job name required}"
    : "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"
    [[ "$E2E_ARTIFACT_DIR" == /* ]] || {
        echo "E2E_ARTIFACT_DIR must be absolute: $E2E_ARTIFACT_DIR" >&2
        return 2
    }
    mkdir -p "$E2E_ARTIFACT_DIR"
    printf 'stage\tstatus\tstarted_at_utc\tfinished_at_utc\tduration_seconds\tdetail\n' \
        > "$E2E_ARTIFACT_DIR/timings.tsv"
    printf '%s\n' "$job_name" > "$E2E_ARTIFACT_DIR/job-name.txt"
    e2e_render_summary
}

e2e_timed() {
    local stage="${1:?stage required}"
    shift
    local started_utc started_epoch finished_utc finished_epoch status exit_code had_errexit=0
    [[ $- == *e* ]] && had_errexit=1
    started_utc="$(e2e_now_utc)"
    started_epoch="$(e2e_now_epoch)"
    set +e
    "$@"
    exit_code=$?
    if [[ "$had_errexit" -eq 1 ]]; then set -e; else set +e; fi
    finished_utc="$(e2e_now_utc)"
    finished_epoch="$(e2e_now_epoch)"
    status=passed
    [[ "$exit_code" -eq 0 ]] || status=failed
    printf '%s\t%s\t%s\t%s\t%s\texit=%s\n' \
        "$stage" "$status" "$started_utc" "$finished_utc" \
        "$((finished_epoch - started_epoch))" "$exit_code" \
        >> "$E2E_ARTIFACT_DIR/timings.tsv"
    e2e_render_summary
    return "$exit_code"
}

e2e_snapshot() {
    local phase="${1:?phase required}"
    local output="$E2E_ARTIFACT_DIR/capacity-$phase.txt"
    {
        printf 'captured_at_utc=%s\n' "$(e2e_now_utc)"
        printf 'phase=%s\n' "$phase"
        printf 'architecture=%s\n' "$(uname -m)"
        printf 'cpu_count=%s\n' "$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo unavailable)"
        echo 'filesystem:'
        df -h /
        echo 'memory:'
        if [[ -r /proc/meminfo ]]; then head -5 /proc/meminfo; else vm_stat 2>/dev/null || true; fi
        echo 'workspace:'
        du -sh "${GITHUB_WORKSPACE:-.}" 2>/dev/null || true
        echo 'docker_system_df:'
        docker system df -v 2>&1 || true
        echo 'docker_buildx_du:'
        docker buildx du 2>&1 || true
    } > "$output"
}

e2e_render_summary() {
    local summary="$E2E_ARTIFACT_DIR/summary.md"
    {
        echo '# Hosted E2E diagnostics'
        echo
        echo '| Stage | Status | Duration | Detail |'
        echo '| --- | --- | ---: | --- |'
        tail -n +2 "$E2E_ARTIFACT_DIR/timings.tsv" 2>/dev/null \
            | while IFS=$'\t' read -r stage status _started _finished duration detail; do
                printf '| %s | %s | %ss | %s |\n' "$stage" "$status" "$duration" "$detail"
              done
        echo
        echo 'Capacity snapshots are included in this artifact as `capacity-*.txt`.'
    } > "$summary"
}
