# Use an official Node runtime as the base image
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

# Copy root workspace files

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.json .npmrc ./
COPY tools/executors/workspace/run-command tools/executors/workspace/run-command

# Copy dependency manifests for better Docker caching
COPY services/learn-card-network/lca-api/package.json services/learn-card-network/lca-api/
COPY packages/learn-card-helpers/package.json packages/learn-card-helpers/
COPY packages/learn-card-types/package.json packages/learn-card-types/
COPY packages/learn-card-core/package.json packages/learn-card-core/
COPY packages/learn-card-init/package.json packages/learn-card-init/
COPY packages/learn-card-network/brain-client/package.json packages/learn-card-network/brain-client/
COPY packages/learn-card-network/cloud-client/package.json packages/learn-card-network/cloud-client/
COPY services/learn-card-network/brain-service/package.json services/learn-card-network/brain-service/
COPY services/learn-card-network/learn-cloud-service/package.json services/learn-card-network/learn-cloud-service/
COPY packages/plugins/chapi/package.json packages/plugins/chapi/
COPY packages/plugins/crypto/package.json packages/plugins/crypto/
COPY packages/plugins/idx/package.json packages/plugins/idx/
COPY packages/plugins/ceramic/package.json packages/plugins/ceramic/
COPY packages/plugins/didkey/package.json packages/plugins/didkey/
COPY packages/plugins/didkit/package.json packages/plugins/didkit/
COPY packages/plugins/didkit-plugin-node/package.json packages/plugins/didkit-plugin-node/
COPY packages/plugins/did-web-plugin/package.json packages/plugins/did-web-plugin/
COPY packages/plugins/dynamic-loader/package.json packages/plugins/dynamic-loader/
COPY packages/plugins/encryption/package.json packages/plugins/encryption/
COPY packages/plugins/ethereum/package.json packages/plugins/ethereum/
COPY packages/plugins/expiration/package.json packages/plugins/expiration/
COPY packages/plugins/learn-card/package.json packages/plugins/learn-card/
COPY packages/plugins/learn-card-network/package.json packages/plugins/learn-card-network/
COPY packages/plugins/linked-claims/package.json packages/plugins/linked-claims/
COPY packages/plugins/learn-cloud/package.json packages/plugins/learn-cloud/
COPY packages/plugins/vc/package.json packages/plugins/vc/
COPY packages/plugins/vc-api/package.json packages/plugins/vc-api/
COPY packages/plugins/vc-templates/package.json packages/plugins/vc-templates/
COPY packages/plugins/vpqr/package.json packages/plugins/vpqr/

RUN pnpm install --no-frozen-lockfile

# Copy full sources after installing dependencies to leverage caching
COPY services/learn-card-network/lca-api services/learn-card-network/lca-api
COPY packages/learn-card-helpers packages/learn-card-helpers
COPY packages/learn-card-types packages/learn-card-types
COPY packages/learn-card-core packages/learn-card-core
COPY packages/learn-card-init packages/learn-card-init
COPY packages/learn-card-network/brain-client packages/learn-card-network/brain-client
COPY packages/learn-card-network/cloud-client packages/learn-card-network/cloud-client
COPY services/learn-card-network/brain-service services/learn-card-network/brain-service
COPY services/learn-card-network/learn-cloud-service services/learn-card-network/learn-cloud-service
COPY packages/plugins/chapi packages/plugins/chapi
COPY packages/plugins/crypto packages/plugins/crypto
COPY packages/plugins/idx packages/plugins/idx
COPY packages/plugins/ceramic packages/plugins/ceramic
COPY packages/plugins/didkey packages/plugins/didkey
COPY packages/plugins/didkit packages/plugins/didkit
COPY packages/plugins/didkit-plugin-node packages/plugins/didkit-plugin-node
COPY packages/plugins/did-web-plugin packages/plugins/did-web-plugin
COPY packages/plugins/dynamic-loader packages/plugins/dynamic-loader
COPY packages/plugins/encryption packages/plugins/encryption
COPY packages/plugins/ethereum packages/plugins/ethereum
COPY packages/plugins/expiration packages/plugins/expiration
COPY packages/plugins/learn-card packages/plugins/learn-card
COPY packages/plugins/learn-card-network packages/plugins/learn-card-network
COPY packages/plugins/linked-claims packages/plugins/linked-claims
COPY packages/plugins/learn-cloud packages/plugins/learn-cloud
COPY packages/plugins/vc packages/plugins/vc
COPY packages/plugins/vc-api packages/plugins/vc-api
COPY packages/plugins/vc-templates packages/plugins/vc-templates
COPY packages/plugins/vpqr packages/plugins/vpqr

RUN rm -rf node_modules/.cache/nx

RUN pnpm exec nx build:docker lca-api-service

# Expose common ports used by server
EXPOSE 3000

CMD ["sh", "-c", "cd services/learn-card-network/lca-api && node --enable-source-maps dist/docker-entry.js"]
