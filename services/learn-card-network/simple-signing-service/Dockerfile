FROM node:20.10.0-slim

# Skip native DIDKit build (uses WASM fallback)
ENV SKIP_DIDKIT_NAPI=1

WORKDIR /app

# Install build dependencies and pnpm in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm

# Copy everything over from the source directory to the build directory
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.json .npmrc ./
COPY packages/learn-card-core packages/learn-card-core
COPY packages/plugins/did-web-plugin packages/plugins/did-web-plugin
COPY packages/plugins/didkey packages/plugins/didkey
COPY packages/plugins/didkit packages/plugins/didkit
COPY packages/plugins/didkit-plugin-node packages/plugins/didkit-plugin-node
COPY packages/plugins/expiration packages/plugins/expiration
COPY packages/learn-card-helpers packages/learn-card-helpers
COPY packages/plugins/learn-card packages/plugins/learn-card
COPY packages/learn-card-types packages/learn-card-types
COPY packages/plugins/vc packages/plugins/vc
COPY tools/executors/workspace/run-command tools/executors/workspace/run-command
COPY services/learn-card-network/simple-signing-service services/learn-card-network/simple-signing-service

RUN pnpm install --no-frozen-lockfile

RUN pnpm exec nx build:docker simple-signing-service

# Expose common ports used by server
EXPOSE 3000

CMD ["sh", "-c", "cd services/learn-card-network/simple-signing-service && node --enable-source-maps dist/docker-entry.js"]
