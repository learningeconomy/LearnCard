#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STORAGE_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/prepare-storage.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

failures=0
fail() { echo "FAIL: $*" >&2; failures=$((failures + 1)); }

make_fixture_commands() {
    local fixture_root="${1:?fixture root required}"
    mkdir -p "$fixture_root/bin" "$fixture_root/state"

    cat > "$fixture_root/bin/df" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
target="${@: -1}"
available="$FAKE_ROOT_FREE_KIB"
mountpoint=/
filesystem=/dev/fake-root
if [[ "$target" == /mnt ]]; then
    available="$FAKE_MNT_FREE_KIB"
    mountpoint=/mnt
    filesystem=/dev/fake-mnt
elif [[ "$target" == /var/lib/docker && -f "$FAKE_STATE_DIR/docker-on-mnt" ]]; then
    available="$FAKE_MNT_FREE_KIB"
    mountpoint=/var/lib/docker
    filesystem=/dev/fake-mnt
elif [[ "$target" == /var/lib/docker ]]; then
    available="$FAKE_DOCKER_FREE_KIB"
    mountpoint=/var/lib/docker
    filesystem=/dev/fake-docker
fi
printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\n'
printf '%s 100000000 1 %s 1%% %s\n' "$filesystem" "$available" "$mountpoint"
STUB

    cat > "$fixture_root/bin/findmnt" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
if [[ "$#" -eq 0 ]]; then
    echo '/dev/fake-root / ext4 rw'
    [[ "$FAKE_LAYOUT" != dual ]] || echo '/dev/fake-mnt /mnt ext4 rw'
    exit 0
fi

path="${@: -1}"
exact_mount=false
[[ " $* " != *' -M '* ]] || exact_mount=true
source=/dev/fake-root
device=8:1
target=/

if [[ "$path" == /mnt ]]; then
    if [[ "$FAKE_LAYOUT" == dual ]]; then
        source=/dev/fake-mnt
        device=8:2
        target=/mnt
    elif [[ "$FAKE_LAYOUT" == same-device-bind ]]; then
        source='/dev/fake-root[/mnt]'
        target=/mnt
    elif [[ "$exact_mount" == true ]]; then
        exit 1
    fi
elif [[ "$path" == /var/lib/docker ]]; then
    if [[ -f "$FAKE_STATE_DIR/docker-on-mnt" ]]; then
        source='/dev/fake-mnt[/learncard-docker]'
        device=8:2
        target=/var/lib/docker
    elif [[ "$exact_mount" == true ]]; then
        exit 1
    else
        device="$FAKE_DOCKER_DEVICE"
    fi
fi

if [[ "$*" == *'MAJ:MIN,TARGET'* ]]; then
    printf '%s %s\n' "$device" "$target"
elif [[ "$*" == *'MAJ:MIN'* ]]; then
    printf '%s\n' "$device"
elif [[ "$*" == *'SOURCE,TARGET'* ]]; then
    printf '%s %s\n' "$source" "$target"
else
    printf '%s\n' "$source"
fi
STUB

    cat > "$fixture_root/bin/lsblk" <<'STUB'
#!/usr/bin/env bash
echo 'NAME SIZE TYPE MOUNTPOINTS'
echo 'fake-root 145G disk /'
[[ "$FAKE_LAYOUT" != dual ]] || echo 'fake-mnt 74G disk /mnt'
STUB

    cat > "$fixture_root/bin/docker" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == info ]]; then
    echo /var/lib/docker
elif [[ "${1:-} ${2:-}" == 'system df' ]]; then
    echo 'TYPE TOTAL ACTIVE SIZE RECLAIMABLE'
else
    echo "unexpected docker command: $*" >&2
    exit 2
fi
STUB

    cat > "$fixture_root/bin/sudo" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$FAKE_SUDO_LOG"
if [[ "${1:-} ${2:-}" == 'mount --bind' ]]; then
    [[ "$FAKE_BIND_SUCCEEDS" != true ]] || touch "$FAKE_STATE_DIR/docker-on-mnt"
fi
STUB

    chmod +x "$fixture_root/bin/df" "$fixture_root/bin/findmnt" \
        "$fixture_root/bin/lsblk" "$fixture_root/bin/docker" "$fixture_root/bin/sudo"
}

run_case() {
    local name="${1:?name required}" layout="${2:?layout required}"
    local root_free_kib="${3:?root free required}" mnt_free_kib="${4:?mnt free required}"
    local docker_free_kib="${5:-$root_free_kib}" bind_succeeds="${6:-true}"
    local fixture_root="$TEST_ROOT/$name"
    make_fixture_commands "$fixture_root"
    mkdir -p "$fixture_root/artifacts"
    : > "$fixture_root/sudo.log"

    set +e
    PATH="$fixture_root/bin:$PATH" \
        E2E_ARTIFACT_DIR="$fixture_root/artifacts" \
        FAKE_LAYOUT="$layout" \
        FAKE_ROOT_FREE_KIB="$root_free_kib" \
        FAKE_MNT_FREE_KIB="$mnt_free_kib" \
        FAKE_DOCKER_FREE_KIB="$docker_free_kib" \
        FAKE_DOCKER_DEVICE=8:1 \
        FAKE_BIND_SUCCEEDS="$bind_succeeds" \
        FAKE_STATE_DIR="$fixture_root/state" \
        FAKE_SUDO_LOG="$fixture_root/sudo.log" \
        bash "$STORAGE_SCRIPT"
    RUN_STATUS=$?
    set -e

    RUN_FIXTURE_ROOT="$fixture_root"
}

gib=$((1024 * 1024))

run_case single-disk single "$((80 * gib))" "$((80 * gib))"
[[ "$RUN_STATUS" -eq 0 ]] || fail 'large single-disk runner was rejected'
grep -Fxq 'layout=single-disk' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'single-disk layout was not recorded'
grep -Fxq 'docker_storage=root' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'single-disk runner did not keep Docker on root'
[[ ! -s "$RUN_FIXTURE_ROOT/sudo.log" ]] || fail 'single-disk runner performed privileged relocation'

run_case dual-disk dual "$((16 * gib))" "$((70 * gib))"
[[ "$RUN_STATUS" -eq 0 ]] || fail 'usable dual-disk runner was rejected'
grep -Fxq 'layout=dual-disk' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'dual-disk layout was not recorded'
grep -Fxq 'docker_storage=mnt-bind' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'dual-disk runner did not record Docker relocation'
grep -Fxq 'mount --bind /mnt/learncard-docker /var/lib/docker' "$RUN_FIXTURE_ROOT/sudo.log" \
    || fail 'Docker storage was not bind-mounted onto /mnt'
grep -Fxq 'result=ready' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'successful dual-disk preparation was not verified'
stop_line="$(grep -nFx 'systemctl stop docker.service docker.socket' "$RUN_FIXTURE_ROOT/sudo.log" | cut -d: -f1)"
mount_line="$(grep -nFx 'mount --bind /mnt/learncard-docker /var/lib/docker' "$RUN_FIXTURE_ROOT/sudo.log" | cut -d: -f1)"
start_line="$(grep -nFx 'systemctl start docker.service' "$RUN_FIXTURE_ROOT/sudo.log" | cut -d: -f1)"
(( stop_line < mount_line && mount_line < start_line )) \
    || fail 'Docker must be stopped before binding and restarted afterward'

run_case same-device-bind same-device-bind "$((80 * gib))" "$((70 * gib))"
[[ "$RUN_STATUS" -eq 0 ]] || fail 'same-device bind mount was rejected despite sufficient root capacity'
grep -Fxq 'layout=single-disk' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'same-device /mnt bind was misclassified as a separate disk'
[[ ! -s "$RUN_FIXTURE_ROOT/sudo.log" ]] || fail 'same-device /mnt bind triggered Docker relocation'

run_case separate-docker-full single "$((80 * gib))" "$((80 * gib))" "$((20 * gib))"
[[ "$RUN_STATUS" -ne 0 ]] || fail 'a full Docker filesystem was accepted based on root capacity'
grep -Fxq "docker_free_kib=$((20 * gib))" "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'capacity was not measured at DockerRootDir'
grep -Fxq 'result=insufficient-capacity' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'full Docker filesystem did not produce an actionable result'

run_case relocation-verification dual "$((16 * gib))" "$((70 * gib))" "$((16 * gib))" false
[[ "$RUN_STATUS" -ne 0 ]] || fail 'failed Docker bind verification was accepted'
grep -Fxq 'result=relocation-verification-failed' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'failed Docker bind did not produce an actionable result'

run_case insufficient-root dual "$((12 * gib))" "$((70 * gib))"
[[ "$RUN_STATUS" -ne 0 ]] || fail 'dual-disk runner with insufficient workspace capacity was accepted'
grep -Fxq 'result=insufficient-capacity' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'insufficient workspace capacity did not produce an actionable result'
[[ ! -s "$RUN_FIXTURE_ROOT/sudo.log" ]] || fail 'Docker was relocated before workspace capacity passed'

run_case insufficient dual "$((8 * gib))" "$((20 * gib))"
[[ "$RUN_STATUS" -ne 0 ]] || fail 'insufficient runner capacity was accepted'
grep -Fxq 'result=insufficient-capacity' "$RUN_FIXTURE_ROOT/artifacts/storage-plan.txt" \
    || fail 'insufficient capacity did not produce an actionable result'
[[ ! -s "$RUN_FIXTURE_ROOT/sudo.log" ]] || fail 'insufficient /mnt was selected for Docker'

[[ "$failures" -eq 0 ]] || exit 1
echo 'Hosted E2E storage tests passed (single, dual, same-device, Docker-root, verification, insufficient)'
