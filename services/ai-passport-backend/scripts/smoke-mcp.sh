#!/usr/bin/env bash
# Post-deploy smoke for the AI Passport MCP server. Read-only: it never writes user data.
#   MCP_BASE_URL         where to send requests (e.g. https://mcp-learncard.fly.dev)
#   EXPECTED_ISSUER      DOMAIN the server was deployed with (OAuth issuer)
#   EXPECTED_RESOURCE    MCP_SERVER_URL the server was deployed with (protected resource)
#   MCP_SMOKE_TOKEN      optional bearer token; without it the authorized checks are skipped
#   MCP_SMOKE_TOOL       read-only tool to call with the token (default get_user_context)
set -euo pipefail

: "${MCP_BASE_URL:?}" "${EXPECTED_ISSUER:?}" "${EXPECTED_RESOURCE:?}"
BASE="${MCP_BASE_URL%/}"
TOOL="${MCP_SMOKE_TOOL:-get_user_context}"
norm() { local u="$1"; printf '%s' "${u%/}"; }
fail() { echo "::error::$1"; exit 1; }
CURL=(curl --silent --show-error --max-time 20)
# Only the first request retries: machines scale to zero and the cold start can take a while.

meta=$("${CURL[@]}" --retry 10 --retry-delay 6 --retry-all-errors --fail "$BASE/.well-known/oauth-protected-resource")
resource=$(jq -r '.resource // empty' <<< "$meta")
issuer=$(jq -r '.authorization_servers[0] // empty' <<< "$meta")
[[ "$(norm "$resource")" == "$(norm "$EXPECTED_RESOURCE")" ]] ||
    fail "protected-resource .resource is '$resource', expected '$EXPECTED_RESOURCE'"
[[ "$(norm "$issuer")" == "$(norm "$EXPECTED_ISSUER")" ]] ||
    fail "protected-resource issuer is '$issuer', expected '$EXPECTED_ISSUER'"
echo "ok: metadata resource=$resource issuer=$issuer"

as_meta=$("${CURL[@]}" --retry 10 --retry-delay 6 --retry-all-errors --fail "$BASE/.well-known/oauth-authorization-server")
as_issuer=$(jq -r '.issuer // empty' <<< "$as_meta")
[[ "$(norm "$as_issuer")" == "$(norm "$EXPECTED_ISSUER")" ]] ||
    fail "authorization-server issuer is '$as_issuer', expected '$EXPECTED_ISSUER'"
echo "ok: authorization-server issuer=$as_issuer"

LIST='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
HDRS=(-H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream')
code=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X POST "${HDRS[@]}" -d "$LIST" "$BASE/")
[[ "$code" == 401 ]] || fail "unauthenticated tools/list returned HTTP $code, expected 401"
echo "ok: unauthenticated request -> 401"

if [[ -z "${MCP_SMOKE_TOKEN:-}" ]]; then
    echo "::warning::MCP_SMOKE_TOKEN not set; skipped authorized tools/list and $TOOL."
    exit 0
fi
AUTH=(-H "Authorization: Bearer $MCP_SMOKE_TOKEN")
tools=$("${CURL[@]}" --fail -X POST "${HDRS[@]}" "${AUTH[@]}" -d "$LIST" "$BASE/")
jq -e --arg t "$TOOL" '.result.tools | map(.name) | index($t) != null' <<< "$tools" >/dev/null ||
    fail "authorized tools/list did not include $TOOL"
echo "ok: authorized tools/list ($(jq '.result.tools | length' <<< "$tools") tools)"

CALL=$(jq -nc --arg t "$TOOL" '{jsonrpc:"2.0",id:2,method:"tools/call",params:{name:$t,arguments:{}}}')
out=$("${CURL[@]}" --fail -X POST "${HDRS[@]}" "${AUTH[@]}" -d "$CALL" "$BASE/")
jq -e '.result and (.result.isError != true)' <<< "$out" >/dev/null || fail "$TOOL call failed"
grep -q 'Unable to retrieve' <<< "$out" && fail "$TOOL reached the server but its backend call failed"
echo "ok: authorized $TOOL"
