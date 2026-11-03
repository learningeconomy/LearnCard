#!/usr/bin/env bash
set -Eeuo pipefail

: "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"
[[ "$E2E_ARTIFACT_DIR" == /* ]] || {
    echo "E2E_ARTIFACT_DIR must be absolute: $E2E_ARTIFACT_DIR" >&2
    exit 2
}

readonly KIB_PER_GIB=$((1024 * 1024))
readonly MIN_ROOT_FREE_KIB="${E2E_MIN_ROOT_FREE_KIB:-$((15 * KIB_PER_GIB))}"
readonly MIN_DOCKER_FREE_KIB="${E2E_MIN_DOCKER_FREE_KIB:-$((35 * KIB_PER_GIB))}"
readonly MNT_DOCKER_DIR=/mnt/learncard-docker
readonly PLAN_FILE="$E2E_ARTIFACT_DIR/storage-plan.txt"
readonly DIAGNOSTICS_FILE="$E2E_ARTIFACT_DIR/runner-storage.txt"
# Preinstalled toolchains the E2E jobs never use. GitHub also schedules hosted
# jobs onto 72G copy-on-write VMs with ~13G free, so reclaim these when short.
readonly DEFAULT_RECLAIM_PATHS='/usr/local/lib/android /usr/share/dotnet /opt/ghc /usr/local/.ghcup /opt/hostedtoolcache/CodeQL /usr/local/share/boost /usr/share/swift /usr/local/share/powershell'
read -r -a RECLAIM_PATHS <<< "${E2E_RECLAIM_PATHS:-$DEFAULT_RECLAIM_PATHS}"
readonly RECLAIM_PATHS

mkdir -p "$E2E_ARTIFACT_DIR"

available_kib() {
    local path="${1:?path required}"
    df -Pk "$path" | awk 'NR == 2 { print $4 }'
}

capture_diagnostics() {
    local phase="${1:?phase required}"
    {
        printf 'phase=%s\n' "$phase"
        echo 'filesystem_all:'
        df -hT 2>&1 || true
        echo 'block_devices:'
        lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS 2>&1 || true
        echo 'mounts:'
        findmnt 2>&1 || true
        echo 'docker_root:'
        docker info --format '{{.DockerRootDir}}' 2>&1 || true
        echo 'docker_system_df:'
        docker system df 2>&1 || true
    } >> "$DIAGNOSTICS_FILE"
}

write_plan() {
    local result="${1:?result required}"
    {
        printf 'layout=%s\n' "$layout"
        printf 'root_free_kib=%s\n' "$root_free_kib"
        printf 'root_required_kib=%s\n' "$MIN_ROOT_FREE_KIB"
        printf 'mnt_free_kib=%s\n' "$mnt_free_kib"
        printf 'docker_free_kib=%s\n' "$docker_free_kib"
        printf 'docker_required_kib=%s\n' "$MIN_DOCKER_FREE_KIB"
        printf 'docker_root=%s\n' "$docker_root"
        printf 'docker_storage=%s\n' "$docker_storage"
        printf 'reclaim=%s\n' "$reclaim"
        printf 'reclaimed_root_kib=%s\n' "$reclaimed_root_kib"
        printf 'result=%s\n' "$result"
    } > "$PLAN_FILE"
}

# Hosted VMs are discarded after the job, so deleting preinstalled software is
# safe there. Never do this on persistent runners selected via E2E_HOSTED_RUNNER.
reclaim_root_space() {
    local path pid failed=0
    local -a pids=()

    echo "Reclaiming hosted runner disk space: ${RECLAIM_PATHS[*]}"
    for path in "${RECLAIM_PATHS[@]}"; do
        [[ "$path" == /* ]] || continue
        sudo rm -rf -- "$path" &
        pids+=("$!")
    done
    for pid in "${pids[@]}"; do
        wait "$pid" || failed=1
    done
    # Preinstalled images are unused; the stack pulls or builds its own.
    docker image prune --all --force > /dev/null || failed=1

    (( failed == 0 )) || echo 'Some disk reclamation steps failed; continuing with measured capacity' >&2
}

capture_diagnostics before

root_device="$(findmnt -nro MAJ:MIN -T /)"
root_free_kib="$(available_kib /)"
docker_root="$(docker info --format '{{.DockerRootDir}}')"
mnt_free_kib=0
docker_free_kib="$(available_kib "$docker_root")"
layout=single-disk
docker_storage=root
reclaim=not-needed
reclaimed_root_kib=0

mnt_mount="$(findmnt -nro MAJ:MIN,TARGET -M /mnt 2>/dev/null || true)"
read -r mnt_device mnt_target _mnt_details <<< "$mnt_mount"

if [[ "$mnt_target" == /mnt && "$mnt_device" != "$root_device" ]]; then
    layout=dual-disk
    mnt_free_kib="$(available_kib /mnt)"
fi

needs_reclaim=false
(( root_free_kib >= MIN_ROOT_FREE_KIB )) || needs_reclaim=true
if [[ "$layout" != dual-disk ]] || (( mnt_free_kib < MIN_DOCKER_FREE_KIB )); then
    (( docker_free_kib >= MIN_DOCKER_FREE_KIB )) || needs_reclaim=true
fi

if [[ "$needs_reclaim" == true ]]; then
    if [[ "${RUNNER_ENVIRONMENT:-}" == github-hosted ]]; then
        reclaim_root_space
        previous_root_free_kib="$root_free_kib"
        root_free_kib="$(available_kib /)"
        docker_free_kib="$(available_kib "$docker_root")"
        reclaimed_root_kib=$((root_free_kib - previous_root_free_kib))
        reclaim=performed
        capture_diagnostics reclaimed
        echo "Reclaimed ${reclaimed_root_kib}KiB on /: root=${root_free_kib}KiB docker=${docker_free_kib}KiB"
    else
        reclaim=skipped-non-hosted
    fi
fi

if [[ "$layout" == dual-disk ]]; then
    if (( mnt_free_kib >= MIN_DOCKER_FREE_KIB && root_free_kib >= MIN_ROOT_FREE_KIB )); then
        # Hosted runners are disposable. Mount an empty Docker root instead of
        # copying preinstalled images so the larger disk starts with maximum capacity.
        sudo mkdir -p "$MNT_DOCKER_DIR" "$docker_root"
        sudo systemctl stop docker.service docker.socket
        sudo mount --bind "$MNT_DOCKER_DIR" "$docker_root"
        sudo systemctl start docker.service docker.socket

        docker_mount="$(findmnt -nro MAJ:MIN,TARGET -M "$docker_root" 2>/dev/null || true)"
        read -r docker_device docker_target _docker_details <<< "$docker_mount"
        docker_free_kib="$(available_kib "$docker_root")"
        if [[ "$docker_target" != "$docker_root" || "$docker_device" != "$mnt_device" ]]; then
            write_plan relocation-verification-failed
            capture_diagnostics after
            echo "Docker storage was not mounted on $docker_root" >&2
            exit 1
        fi
        docker_storage=mnt-bind
    fi
fi

if (( root_free_kib < MIN_ROOT_FREE_KIB || docker_free_kib < MIN_DOCKER_FREE_KIB )); then
    write_plan insufficient-capacity
    capture_diagnostics after
    echo "Hosted E2E runner has insufficient storage: root=${root_free_kib}KiB docker=${docker_free_kib}KiB" >&2
    exit 1
fi

write_plan ready
capture_diagnostics after

echo "Hosted E2E storage ready: layout=$layout docker_storage=$docker_storage"
