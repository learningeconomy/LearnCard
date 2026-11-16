#!/usr/bin/env bash
# Roll back the AI Passport MCP Fly app to a previous image while re-supplying the
# OAuth and Qdrant values that deploy.yml passes only via `fly deploy --env`
# (they are not in fly.mcp.toml, and cutover removes shadowing Fly secrets).
#
# Usage (from monorepo root):
#   FLY_APP=mcp-learncard \
#   MCP_DOMAIN=https://api.learncloud.ai/ \
#   MCP_SERVER_URL=https://mcp.learncard.ai/ \
#   QDRANT_HOST=... QDRANT_PORT=... QDRANT_HTTPS=true \
#   MCP_REDIS_PREFIX=... \
#   IMAGE=<previous image ref from `fly releases -a mcp-learncard --image`> \
#   services/ai-passport-backend/scripts/rollback-mcp.sh
#
# Pre-cutover releases that relied on DOMAIN/MCP_SERVER_URL Fly secrets: after those
# secrets are removed, this script's --env values are what the restored image sees.
# If you must restore the exact pre-cutover secret-based config instead, re-set those
# secrets under a separate approval before rolling back, then run this script with the
# same OAuth/Qdrant/Redis prefix values the old release effectively used.
set -euo pipefail

: "${FLY_APP:?}" "${IMAGE:?}"
: "${MCP_DOMAIN:?}" "${MCP_SERVER_URL:?}"
: "${QDRANT_HOST:?}" "${QDRANT_PORT:?}" "${QDRANT_HTTPS:?}"
: "${MCP_REDIS_PREFIX:?}"

if [[ ! "$MCP_DOMAIN" =~ ^https:// || ! "$MCP_SERVER_URL" =~ ^https:// ]]; then
  echo "MCP_DOMAIN and MCP_SERVER_URL must be https URLs" >&2
  exit 1
fi
if [[ ! "$QDRANT_HOST" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ || "$QDRANT_HOST" =~ (^|\.)localhost$|^127\.|^0\.0\.0\.0$ ]]; then
  echo "QDRANT_HOST must be a non-loopback hostname" >&2
  exit 1
fi
if [[ ! "$QDRANT_PORT" =~ ^[0-9]{1,5}$ ]] || (( 10#$QDRANT_PORT < 1 || 10#$QDRANT_PORT > 65535 )); then
  echo "QDRANT_PORT must be 1..65535" >&2
  exit 1
fi
[[ "$QDRANT_HTTPS" == true || "$QDRANT_HTTPS" == false ]] || { echo "QDRANT_HTTPS must be true or false" >&2; exit 1; }
if [[ ! "$MCP_REDIS_PREFIX" =~ ^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$ ]]; then
  echo "MCP_REDIS_PREFIX must be the shared API/worker prefix" >&2
  exit 1
fi

flyctl deploy . \
  --remote-only \
  --config services/ai-passport-backend/fly.mcp.toml \
  --app "$FLY_APP" \
  --image "$IMAGE" \
  --env "DOMAIN=$MCP_DOMAIN" \
  --env "MCP_SERVER_URL=$MCP_SERVER_URL" \
  --env "QDRANT_HOST=$QDRANT_HOST" \
  --env "QDRANT_PORT=$QDRANT_PORT" \
  --env "QDRANT_HTTPS=$QDRANT_HTTPS" \
  --env "REDIS_PREFIX=$MCP_REDIS_PREFIX"

echo "Rollback deploy requested for $FLY_APP -> $IMAGE (OAuth/Qdrant/Redis prefix re-supplied via --env)."
