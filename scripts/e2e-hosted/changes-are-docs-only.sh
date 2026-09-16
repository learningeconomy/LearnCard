#!/usr/bin/env bash
# Exit 0 when every file changed between BASE and HEAD is documentation.
# Exit 1 (run E2E) on any code change, an empty diff, or when the diff cannot be computed.
set -Eeuo pipefail

BASE="${1:?base ref required}"
HEAD="${2:-HEAD}"

DOCS_ONLY_PATTERNS=(
    '^docs/'
    '^[^/]+\.md$'
    '^\.github/(ISSUE_TEMPLATE|PULL_REQUEST_TEMPLATE)'
    '^\.changeset/.*\.md$'
    '(^|/)(README|CHANGELOG|LICENSE|CODE_OF_CONDUCT|CONTRIBUTING)(\.md)?$'
)

if [[ -z "$BASE" ]]; then
    echo 'docs-only check: no base ref provided; running E2E.' >&2
    exit 1
fi

merge_base=$(git merge-base "$BASE" "$HEAD" 2>/dev/null) || {
    echo "docs-only check: cannot compute merge-base of $BASE and $HEAD; running E2E." >&2
    exit 1
}

changed_files=$(git diff --name-only "$merge_base" "$HEAD")

if [[ -z "$changed_files" ]]; then
    echo 'docs-only check: empty diff; running E2E.' >&2
    exit 1
fi

pattern=$(IFS='|'; echo "${DOCS_ONLY_PATTERNS[*]}")

non_docs=$(grep -Ev "$pattern" <<< "$changed_files" || true)

if [[ -n "$non_docs" ]]; then
    echo 'docs-only check: non-documentation changes detected:' >&2
    head -20 <<< "$non_docs" >&2
    exit 1
fi

echo 'docs-only check: all changed files are documentation.' >&2
sed 's/^/  /' <<< "$changed_files" >&2
exit 0
