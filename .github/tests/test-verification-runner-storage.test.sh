#!/usr/bin/env bash
set -Eeuo pipefail

readonly repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
readonly script="$repo_root/scripts/verification-runner-storage.sh"
readonly test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT
mkdir -p "$test_root/bin"

# Fake commands ensure these tests never delete software or query actual space.
cat > "$test_root/bin/df" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
[[ "${FAKE_DF_FAIL:-0}" != 1 ]] || exit 1
available="$FAKE_BEFORE_KIB"
[[ ! -f "$FAKE_DIR/cleaned" ]] || available="$FAKE_AFTER_KIB"
printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\n'
printf 'fake 999999999 0 %s 0%% /\n' "$available"
STUB
cat > "$test_root/bin/sudo" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$FAKE_DIR/sudo.log"
touch "$FAKE_DIR/cleaned"
[[ "${FAKE_SUDO_FAIL:-0}" != 1 ]]
STUB
chmod +x "$test_root/bin/df" "$test_root/bin/sudo"
export PATH="$test_root/bin:$PATH" GITHUB_WORKSPACE="$repo_root"

run_case() {
    local name="$1" environment="$2" before="$3" after="$4"
    export FAKE_DIR="$test_root/$name" FAKE_BEFORE_KIB="$before" FAKE_AFTER_KIB="$after"
    mkdir -p "$FAKE_DIR"
    : > "$FAKE_DIR/sudo.log"
    RUNNER_ENVIRONMENT="$environment" bash "$script" before-setup 20971520 > "$FAKE_DIR/output" 2>&1
}

run_case ample github-hosted 30000000 30000000
grep -Fxq 'verification_storage phase=before-setup before_kib=30000000 after_kib=30000000 minimum_kib=20971520 reclaim=not-needed' "$FAKE_DIR/output"
[[ ! -s "$FAKE_DIR/sudo.log" ]]

run_case hosted github-hosted 13000000 43000000
grep -Fxq 'verification_storage phase=before-setup before_kib=13000000 after_kib=43000000 minimum_kib=20971520 reclaim=performed' "$FAKE_DIR/output"
[[ "$(wc -l < "$FAKE_DIR/sudo.log" | tr -d ' ')" == 8 ]]
grep -Fxq 'rm -rf -- /usr/local/lib/android' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /usr/share/dotnet' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /opt/ghc' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /usr/local/.ghcup' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /opt/hostedtoolcache/CodeQL' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /usr/local/share/boost' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /usr/share/swift' "$FAKE_DIR/sudo.log"
grep -Fxq 'rm -rf -- /usr/local/share/powershell' "$FAKE_DIR/sudo.log"

run_case persistent self-hosted 1000000 1000000
grep -Fxq 'verification_storage phase=before-setup before_kib=1000000 after_kib=1000000 minimum_kib=20971520 reclaim=skipped-non-hosted' "$FAKE_DIR/output"
[[ ! -s "$FAKE_DIR/sudo.log" ]]

run_case insufficient github-hosted 1000000 2000000
grep -Fxq 'verification_storage phase=before-setup before_kib=1000000 after_kib=2000000 minimum_kib=20971520 reclaim=performed' "$FAKE_DIR/output"

export FAKE_SUDO_FAIL=1
run_case partial github-hosted 13000000 43000000
grep -Fq 'Some verification runner cleanup commands failed' "$FAKE_DIR/output"
grep -Fq 'after_kib=43000000' "$FAKE_DIR/output"
unset FAKE_SUDO_FAIL

# The late check uses the actual 10 GiB preflight threshold, including equality.
export FAKE_DIR="$test_root/late" FAKE_BEFORE_KIB=10485760 FAKE_AFTER_KIB=10485760
mkdir -p "$FAKE_DIR"
: > "$FAKE_DIR/sudo.log"
RUNNER_ENVIRONMENT=github-hosted bash "$script" before-preflight 10485760 > "$FAKE_DIR/output"
grep -Fxq 'verification_storage phase=before-preflight before_kib=10485760 after_kib=10485760 minimum_kib=10485760 reclaim=not-needed' "$FAKE_DIR/output"
[[ ! -s "$FAKE_DIR/sudo.log" ]]

if bash "$script" before-setup invalid > /dev/null 2>&1; then exit 1; fi
if bash "$script" unsupported 100 > /dev/null 2>&1; then exit 1; fi
if FAKE_DF_FAIL=1 bash "$script" before-preflight 10485760 > /dev/null 2>&1; then exit 1; fi
printf '%s\n' 'Verification runner storage tests passed'
