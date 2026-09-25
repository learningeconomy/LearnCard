#!/usr/bin/env bash
set -euo pipefail
# Offline CodeBuild lifecycle tests, including failure and catchable cancellation.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir "$work/bin"
cat >"$work/bin/aws" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$TEST_WORK/calls"
case "$1 $2" in
    'codebuild start-build') printf 'offline:build-id\n' ;;
    'codebuild stop-build')
        cp "$TEST_WORK/clock" "$TEST_WORK/stop-time"
        touch "$TEST_WORK/stopping"
        [[ "$SCENARIO" != stop-error ]] ;;
    'codebuild batch-get-builds')
        if [[ -e "$TEST_WORK/stopping" ]]; then
            if [[ "$SCENARIO" == stop-error ]]; then exit 43; fi
            printf 'terminal\n' >>"$TEST_WORK/calls"
            printf 'STOPPED\n'
        else
            case "$SCENARIO" in
                success) printf 'SUCCEEDED\n' ;;
                failed) printf 'FAILED\n' ;;
                poll-error) exit 43 ;;
                unknown) printf 'None\n' ;;
                signal) kill -TERM "$TEST_DEPLOY_PID"; printf 'IN_PROGRESS\n' ;;
                *) printf 'IN_PROGRESS\n' ;;
            esac
        fi ;;
    *) exit 99 ;;
esac
MOCK
cat >"$work/bin/date" <<'MOCK'
#!/usr/bin/env bash
clock=$(<"$TEST_WORK/clock")
printf '%s\n' "$clock"
printf '%s\n' "$((clock + 60))" >"$TEST_WORK/clock"
MOCK
cat >"$work/bin/sleep" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat >"$work/run" <<'HARNESS'
#!/usr/bin/env bash
set -euo pipefail
source "$SCRIPTS/realm-runner.sh"
export TEST_DEPLOY_PID=$$
name=offline
release_sha=reviewed-sha
cleanup() {
    result=$?
    trap - EXIT
    trap '' INT TERM HUP
    stop_realm_build "$TEST_WORK/build-id" || exit 1
    printf 'cleanup\n' >>"$TEST_WORK/calls"
    exit "$result"
}
trap cleanup EXIT
trap 'exit 143' TERM
if [[ "$SCENARIO" == interrupted-id ]]; then
    printf 'offline:build-id\n' >"$TEST_WORK/build-id"
    exit 1
fi
run_realm_build "$TEST_WORK/build-id" "$name" "$release_sha"
HARNESS
chmod +x "$work/bin/"*
export PATH="$work/bin:$PATH" SCRIPTS="$scripts"
for scenario in success failed timeout poll-error unknown signal stop-error interrupted-id; do
    export SCENARIO=$scenario TEST_WORK="$work/$scenario"
    mkdir "$TEST_WORK"
    printf '0\n' >"$TEST_WORK/clock"
    : >"$TEST_WORK/calls"
    result=0
    bash "$work/run" >"$TEST_WORK/log" 2>&1 || result=$?
    if [[ "$scenario" == success ]]; then
        [[ "$result" == 0 ]] || { cat "$TEST_WORK/log"; exit 1; }
    else
        [[ "$result" != 0 ]] || exit 1
    fi
    case "$scenario" in
        success|failed)
            ! grep -q 'codebuild stop-build' "$TEST_WORK/calls" ;;
        stop-error)
            grep -q 'may still be running' "$TEST_WORK/log"
            ! grep -q '^cleanup$' "$TEST_WORK/calls"
            [[ $(<"$TEST_WORK/clock") -le 4320 ]] ;;
        *)
            grep -q 'codebuild stop-build --id offline:build-id' "$TEST_WORK/calls"
            [[ $(tail -n 2 "$TEST_WORK/calls") == $'terminal\ncleanup' ]] ;;
    esac
    if [[ "$scenario" == timeout ]]; then
        [[ $(<"$TEST_WORK/stop-time") -ge 3900 ]]
        grep -q 'Realm runner timed out' "$TEST_WORK/log"
    fi
    printf 'PASS: realm runner %s\n' "$scenario"
done
