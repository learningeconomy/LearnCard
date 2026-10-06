#!/usr/bin/env bash
set -euo pipefail
# Real ancestry checks in an isolated repository; all AWS calls are mocked.
scripts=$(cd "$(dirname "$0")" && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin" "$work/repo"
cat >"$work/bin/aws" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ ${AWS_FAILURE:-false} != true ]] || exit 42
case "$1 $2" in
    's3api list-objects-v2')
        if [[ -f "$JOURNAL" ]]; then
            printf '{"Contents":[{"Key":"keycloak/%s/compat/deployment.json"}]}\n' "$DEPLOY_ENVIRONMENT"
        else printf '{}\n'; fi ;;
    's3api get-object') cp "$JOURNAL" "${@: -1}" ;;
    *) printf 'Unexpected AWS mutation: %s\n' "$*" >&2; exit 99 ;;
esac
MOCK
chmod +x "$work/bin/aws"
export PATH="$work/bin:$PATH" JOURNAL="$work/journal.json"
export TF_STATE_BUCKET=offline GITHUB_EVENT_NAME=push ALLOW_ROLLBACK=false
unset RELEASE_SHA
GIT_MASTER=1 git -C "$work/repo" init -q
cd "$work/repo"
export GIT_AUTHOR_NAME=Test GIT_AUTHOR_EMAIL=test@example.invalid
export GIT_COMMITTER_NAME=Test GIT_COMMITTER_EMAIL=test@example.invalid
tree=$(GIT_MASTER=1 git mktree </dev/null)
old=$(printf 'old\n' | GIT_MASTER=1 git commit-tree "$tree")
new=$(printf 'new\n' | GIT_MASTER=1 git commit-tree "$tree" -p "$old")
diverged=$(printf 'diverged\n' | GIT_MASTER=1 git commit-tree "$tree" -p "$old")
unknown=1111111111111111111111111111111111111111
check() {
    local expected=$1 result=0
    bash "$scripts/check-release-order.sh" >"$work/log" 2>&1 || result=$?
    if [[ "$expected" == pass && "$result" != 0 ]] || [[ "$expected" == fail && "$result" == 0 ]]; then
        cat "$work/log"; exit 1
    fi
}
journal() { jq -n --arg sha "$1" '{status:"complete",sha:$sha}' >"$JOURNAL"; }
for environment in staging production; do
    export DEPLOY_ENVIRONMENT=$environment GITHUB_SHA=$new
    rm -f "$JOURNAL"
    check pass # First deploy.
    journal "$old"; check pass # Descendant.
    journal "$new"; check pass # Idempotent rerun.
    export GITHUB_SHA=$old
    check fail # Stale queued run.
    grep -q 'Refusing deployment: candidate' "$work/log"
    export GITHUB_SHA=$diverged
    check fail # Not a descendant, even if created later.
    export GITHUB_SHA=$new RELEASE_SHA=$old
    check fail # Promotion/manual service apply checks image SHA, not workflow HEAD.
    export ALLOW_ROLLBACK=true
    check fail # Push cannot use the override.
    export GITHUB_EVENT_NAME=workflow_dispatch
    check pass # Deliberate manual rollback.
    printf '{"status":"pending","sha":"%s"}\n' "$new" >"$JOURNAL"
    check fail # Override cannot bypass incomplete deployment recovery.
    export ALLOW_ROLLBACK=false GITHUB_EVENT_NAME=push
    unset RELEASE_SHA
    journal "$unknown"; check fail # Missing history fails closed.
    journal bad-sha; check fail
    printf 'not json\n' >"$JOURNAL"; check fail
    rm "$JOURNAL"
    export AWS_FAILURE=true
    check fail # An unreadable journal is not a first deploy.
    unset AWS_FAILURE
    printf 'PASS: %s release ordering, promotion SHA, dispatch-only override and fail-closed journal reads\n' "$environment"
done
