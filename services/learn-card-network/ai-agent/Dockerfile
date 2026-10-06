# syntax=docker/dockerfile:1.7
FROM oven/bun:1.3.14 AS build

ENV NODE_ENV=production \
    SKIP_DIDKIT_NAPI=1

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
RUN bun run --cwd services/learn-card-network/ai-agent build
RUN bun build services/learn-card-network/ai-agent/scripts/runtime-did-auth-smoke.ts \
    --target=bun \
    --conditions=development \
    --outfile=services/learn-card-network/ai-agent/dist/runtime-did-auth-smoke.js \
    --external='@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'

FROM oven/bun:1.3.14-alpine

RUN apk upgrade --no-cache

ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA} \
    NODE_ENV=production \
    PORT=3000 \
    SKIP_DIDKIT_NAPI=1

WORKDIR /app
RUN install -d -o bun -g bun -m 0555 \
    ./node_modules/@learncard/didkit-plugin/src/didkit/pkg

COPY --chown=bun:bun --chmod=0444 --from=build /app/services/learn-card-network/ai-agent/dist/index.js ./index.js
COPY --chown=bun:bun --chmod=0444 --from=build /app/packages/plugins/didkit/package.json ./node_modules/@learncard/didkit-plugin/package.json
COPY --chown=bun:bun --chmod=0444 --from=build /app/packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm ./node_modules/@learncard/didkit-plugin/src/didkit/pkg/didkit_wasm_bg.wasm

EXPOSE 3000

USER bun
# Resolve the smoke's external WASM from the same node_modules as index.js.
# A /tmp entrypoint can resolve a registry package instead of our copied artifact.
RUN --mount=from=build,source=/app/services/learn-card-network/ai-agent/dist/runtime-did-auth-smoke.js,target=/app/runtime-did-auth-smoke.js,ro \
    bun --no-install --conditions=development /app/runtime-did-auth-smoke.js


CMD ["bun", "--no-install", "--conditions=development", "index.js"]
