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
        printf 'result=%s\n' "$result"
    } > "$PLAN_FILE"
}

capture_diagnostics before

root_device="$(findmnt -nro MAJ:MIN -T /)"
root_free_kib="$(available_kib /)"
docker_root="$(docker info --format '{{.DockerRootDir}}')"
mnt_free_kib=0
docker_free_kib="$(available_kib "$docker_root")"
layout=single-disk
docker_storage=root

mnt_mount="$(findmnt -nro MAJ:MIN,TARGET -M /mnt 2>/dev/null || true)"
read -r mnt_device mnt_target _mnt_details <<< "$mnt_mount"

if [[ "$mnt_target" == /mnt && "$mnt_device" != "$root_device" ]]; then
    layout=dual-disk
    mnt_free_kib="$(available_kib /mnt)"

    if (( mnt_free_kib >= MIN_DOCKER_FREE_KIB && root_free_kib >= MIN_ROOT_FREE_KIB )); then
        sudo mkdir -p "$MNT_DOCKER_DIR" "$docker_root"
        sudo systemctl stop docker.service docker.socket
        sudo mount --bind "$MNT_DOCKER_DIR" "$docker_root"
        sudo systemctl start docker.service

        docker_mount="$(findmnt -nro MAJ:MIN,TARGET -M "$docker_root" 2>/dev/null || true)"
        read -r docker_device docker_target _docker_details <<< "$docker_mount"
        docker_free_kib="$(available_kib "$docker_root")"
        if [[ "$docker_target" != "$docker_root" || "$docker_device" != "$mnt_device" ]]; then
            write_plan relocation-verification-failed
            echo "Docker storage was not mounted on $docker_root" >&2
            exit 1
        fi
        docker_storage=mnt-bind
    fi
fi

if (( root_free_kib < MIN_ROOT_FREE_KIB || docker_free_kib < MIN_DOCKER_FREE_KIB )); then
    write_plan insufficient-capacity
    echo "Hosted E2E runner has insufficient storage: root=${root_free_kib}KiB docker=${docker_free_kib}KiB" >&2
    exit 1
fi

write_plan ready
capture_diagnostics after

echo "Hosted E2E storage ready: layout=$layout docker_storage=$docker_storage"
