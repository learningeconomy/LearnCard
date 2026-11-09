#!/usr/bin/env bash
# Print alignment fingerprints for an AI Passport Fly app.
# Never prints AI_PRIVACY_KEY, MONGO_URI, REDIS_PASSWORD, or other secret values.
#
# Usage:
#   services/ai-passport-backend/scripts/mcp-alignment-fingerprint.sh --app ai-passport
#   services/ai-passport-backend/scripts/mcp-alignment-fingerprint.sh --app mcp-learncard \
#     --redis-prefix shared --qdrant-host q.example --qdrant-port 6333 --qdrant-https true
#
# Optional overrides inject only into the remote fingerprint process (for pre-traffic checks of
# values that deploy will pass via --env). They never print and never write Fly secrets.
#
# Output (stable, parseable):
#   privacy=<64 hex>
#   redis=<64 hex>
#   mongo=<64 hex>
#   qdrant=<64 hex>
#
# Why not Fly secret digests?
#   flyctl secrets list digests are truncated, collide-able change hints (Fly's own wording),
#   not authenticators of equality across apps. This script HMACs inside the running app so
#   the comparison uses the real key/material without disclosing it.
set -euo pipefail

APP=""
REDIS_PREFIX_OVERRIDE=""
QDRANT_HOST_OVERRIDE=""
QDRANT_PORT_OVERRIDE=""
QDRANT_HTTPS_OVERRIDE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --app|-a) APP="${2:?}"; shift 2 ;;
    --redis-prefix) REDIS_PREFIX_OVERRIDE="${2:?}"; shift 2 ;;
    --qdrant-host) QDRANT_HOST_OVERRIDE="${2:?}"; shift 2 ;;
    --qdrant-port) QDRANT_PORT_OVERRIDE="${2:?}"; shift 2 ;;
    --qdrant-https) QDRANT_HTTPS_OVERRIDE="${2:?}"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
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
const fp = (label, parts) =>
  createHmac("sha256", root).update(label).update(parts).digest("hex");
const privacy = createHmac("sha256", root)
  .update("ai-passport-mcp-alignment:privacy-key:v1")
  .digest("hex");
const redis = fp(
  "ai-passport-mcp-alignment:redis-store:v1\0",
  [
    process.env.REDIS_HOST || "",
    process.env.REDIS_PORT || "",
    process.env.REDIS_PASSWORD || "",
    process.env.REDIS_PREFIX || "default",
  ].join("\0")
);
const mongo = fp("ai-passport-mcp-alignment:mongo:v1\0", process.env.MONGO_URI || "");
const qdrant = fp(
  "ai-passport-mcp-alignment:qdrant:v1\0",
  [
    process.env.QDRANT_HOST || "",
    process.env.QDRANT_PORT || "",
    process.env.QDRANT_HTTPS || "",
  ].join("\0")
);
root.fill(0);
console.log("privacy=" + privacy);
console.log("redis=" + redis);
console.log("mongo=" + mongo);
console.log("qdrant=" + qdrant);
NODE
)
REMOTE_B64=$(printf '%s' "$REMOTE_JS" | base64 -w0)

# Build a remote env prefix for --env values that are not yet on the machine.
remote_env=()
[[ -n "$REDIS_PREFIX_OVERRIDE" ]] && remote_env+=("REDIS_PREFIX=$(printf '%q' "$REDIS_PREFIX_OVERRIDE")")
[[ -n "$QDRANT_HOST_OVERRIDE" ]] && remote_env+=("QDRANT_HOST=$(printf '%q' "$QDRANT_HOST_OVERRIDE")")
[[ -n "$QDRANT_PORT_OVERRIDE" ]] && remote_env+=("QDRANT_PORT=$(printf '%q' "$QDRANT_PORT_OVERRIDE")")
[[ -n "$QDRANT_HTTPS_OVERRIDE" ]] && remote_env+=("QDRANT_HTTPS=$(printf '%q' "$QDRANT_HTTPS_OVERRIDE")")
remote_prefix=$(IFS=' '; echo "${remote_env[*]}")

out=$(flyctl ssh console --app "$APP" -C "${remote_prefix:+$remote_prefix }node -e \"eval(Buffer.from('$REMOTE_B64','base64').toString('utf8'))\"")
privacy=$(awk -F= '/^privacy=/{print $2}' <<< "$out")
redis=$(awk -F= '/^redis=/{print $2}' <<< "$out")
mongo=$(awk -F= '/^mongo=/{print $2}' <<< "$out")
qdrant=$(awk -F= '/^qdrant=/{print $2}' <<< "$out")
for name in privacy redis mongo qdrant; do
  value="${!name}"
  if [[ ! "$value" =~ ^[a-f0-9]{64}$ ]]; then
    echo "failed to read $name fingerprint from app $APP (is a machine up? does the token allow ssh?)" >&2
    exit 1
  fi
done
printf 'privacy=%s\nredis=%s\nmongo=%s\nqdrant=%s\n' "$privacy" "$redis" "$mongo" "$qdrant"
