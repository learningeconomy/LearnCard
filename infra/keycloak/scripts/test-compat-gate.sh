#!/usr/bin/env bash
set -euo pipefail
# Offline exit-code contract tests; never invokes a real registry or AWS.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir "$work/bin"
cat >"$work/bin/docker" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$@" >"$DOCKER_ARGS"
exit "$DOCKER_EXIT"
MOCK
chmod +x "$work/bin/docker"
export PATH="$work/bin:$PATH"
export DOCKER_ARGS="$work/args" GITHUB_OUTPUT="$work/output"
printf '{}\n' >"$work/prev.json"
chmod 600 "$work/prev.json"
for code in 0 3 4 1 2 125; do
    export DOCKER_EXIT=$code
    : >"$GITHUB_OUTPUT"
    result=0
    bash "$scripts/compat-gate.sh" "$work/prev.json" candidate:test >"$work/log" 2>&1 || result=$?
    case "$code" in
        0) expected=rolling ;;
        3|4) expected=recreate ;;
        *)
            [[ "$result" == "$code" && ! -s "$GITHUB_OUTPUT" ]]
            printf 'PASS: exit %s fails closed without a strategy\n' "$code"
            continue ;;
    esac
    [[ "$result" == 0 && $(<"$GITHUB_OUTPUT") == "strategy=$expected" ]]
    grep -Fx -- '--user' "$DOCKER_ARGS" >/dev/null
    grep -Fx -- "$(id -u):$(id -g)" "$DOCKER_ARGS" >/dev/null
    printf 'PASS: exit %s selects %s with caller UID\n' "$code" "$expected"
done
: >"$GITHUB_OUTPUT"
bash "$scripts/compat-gate.sh" "$work/missing.json" candidate:test >"$work/log"
[[ $(<"$GITHUB_OUTPUT") == strategy=recreate ]]
printf 'PASS: absent first-deployment metadata selects recreate\n'
