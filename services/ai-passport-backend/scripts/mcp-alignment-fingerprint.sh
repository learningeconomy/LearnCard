#!/usr/bin/env bash
# Print privacy-key and Redis-store alignment fingerprints for an AI Passport Fly app.
# Never prints AI_PRIVACY_KEY, REDIS_PASSWORD, or other secret values.
#
# Usage:
#   services/ai-passport-backend/scripts/mcp-alignment-fingerprint.sh --app ai-passport
#   services/ai-passport-backend/scripts/mcp-alignment-fingerprint.sh --app mcp-learncard
#
# Output (stable, parseable):
#   privacy=<64 hex>
#   redis=<64 hex>
#
# Why not Fly secret digests?
#   flyctl secrets list digests are truncated, collide-able change hints (Fly's own wording),
#   not authenticators of equality across apps. This script HMACs inside the running app so
#   the comparison uses the real key/material without disclosing it.
set -euo pipefail

APP=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app|-a) APP="${2:?}"; shift 2 ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
: "${APP:?--app <fly-app> is required}"

REMOTE_JS=$(cat <<'NODE'
const { createHmac } = require("crypto");
const key = process.env.AI_PRIVACY_KEY || "";
if (!key) {
  console.error("AI_PRIVACY_KEY missing in app environment");
  process.exit(2);
}
let root;
try {
  root = Buffer.from(key, "base64");
  if (root.length !== 32 || root.toString("base64") !== key) throw new Error("invalid");
} catch {
  console.error("AI_PRIVACY_KEY is not a canonical base64 32-byte key");
  process.exit(2);
}
const privacy = createHmac("sha256", root)
  .update("ai-passport-mcp-alignment:privacy-key:v1")
  .digest("hex");
const redisParts = [
  process.env.REDIS_HOST || "",
  process.env.REDIS_PORT || "",
  process.env.REDIS_PASSWORD || "",
  process.env.REDIS_PREFIX || "default",
].join("\0");
const redis = createHmac("sha256", root)
  .update("ai-passport-mcp-alignment:redis-store:v1\0")
  .update(redisParts)
  .digest("hex");
root.fill(0);
console.log("privacy=" + privacy);
console.log("redis=" + redis);
NODE
)
REMOTE_B64=$(printf '%s' "$REMOTE_JS" | base64 -w0)

out=$(flyctl ssh console --app "$APP" -C "node -e \"eval(Buffer.from('$REMOTE_B64','base64').toString('utf8'))\"")
privacy=$(awk -F= '/^privacy=/{print $2}' <<< "$out")
redis=$(awk -F= '/^redis=/{print $2}' <<< "$out")
if [[ ! "$privacy" =~ ^[a-f0-9]{64}$ || ! "$redis" =~ ^[a-f0-9]{64}$ ]]; then
  echo "failed to read fingerprints from app $APP (is a machine up? does the token allow ssh?)" >&2
  exit 1
fi
printf 'privacy=%s\nredis=%s\n' "$privacy" "$redis"
