# Use an official Node runtime as the base image
# Using bullseye (Debian 11) to avoid native module build issues on Debian 12
FROM node:20.10.0-bullseye-slim

# Skip native DIDKit build (not needed for browser apps, uses WASM fallback)
ENV SKIP_DIDKIT_NAPI=1

# Set the working directory in the container
WORKDIR /app

# Install build dependencies and Bun in one layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g bun@1.3.14

# Copy root workspace files
COPY package.json bun.lock bunfig.toml nx.json tsconfig.json ./

# Copy every workspace member's package.json so `bun install --frozen-lockfile`
# can reconstruct the full workspace graph and match the committed bun.lock.
COPY reference/package.json reference/
COPY scripts/siwa-migration/package.json scripts/siwa-migration/
COPY services/learn-card-network/lca-api/package.json services/learn-card-network/lca-api/
COPY packages/lca-api-client/package.json packages/lca-api-client/
COPY packages/plugins/lca-api-plugin/package.json packages/plugins/lca-api-plugin/
COPY packages/learn-card-helpers/package.json packages/learn-card-helpers/
COPY packages/react-learn-card/package.json packages/react-learn-card/
COPY packages/learn-card-base/package.json packages/learn-card-base/
COPY packages/learn-card-types/package.json packages/learn-card-types/
COPY packages/learn-card-init/package.json packages/learn-card-init/
COPY packages/learn-card-core/package.json packages/learn-card-core/
COPY packages/learn-card-network/brain-client/package.json packages/learn-card-network/brain-client/
COPY packages/learn-card-network/cloud-client/package.json packages/learn-card-network/cloud-client/
COPY packages/learn-card-network/simple-signing-client/package.json packages/learn-card-network/simple-signing-client/
COPY services/learn-card-network/brain-service/package.json services/learn-card-network/brain-service/
COPY services/learn-card-network/learn-cloud-service/package.json services/learn-card-network/learn-cloud-service/
COPY services/learn-card-network/simple-signing-service/package.json services/learn-card-network/simple-signing-service/
COPY packages/plugins/chapi/package.json packages/plugins/chapi/
COPY packages/plugins/crypto/package.json packages/plugins/crypto/
COPY packages/plugins/ceramic/package.json packages/plugins/ceramic/
COPY packages/plugins/idx/package.json packages/plugins/idx/
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
COPY packages/plugins/ler-rs/package.json packages/plugins/ler-rs/
COPY packages/plugins/render-method/package.json packages/plugins/render-method/
COPY packages/plugins/open-badge-v2/package.json packages/plugins/open-badge-v2/
COPY packages/plugins/openid4vc/package.json packages/plugins/openid4vc/
COPY packages/plugins/sd-jwt-vc/package.json packages/plugins/sd-jwt-vc/
COPY packages/plugins/vc/package.json packages/plugins/vc/
COPY packages/plugins/vc-api/package.json packages/plugins/vc-api/
COPY packages/plugins/vc-templates/package.json packages/plugins/vc-templates/
COPY packages/plugins/vpqr/package.json packages/plugins/vpqr/
COPY packages/plugins/simple-signing-plugin/package.json packages/plugins/simple-signing-plugin/
COPY packages/learn-card-embed-sdk/package.json packages/learn-card-embed-sdk/
COPY packages/credential-library/package.json packages/credential-library/
COPY apps/learn-card-app/package.json apps/learn-card-app/
COPY packages/sss-key-manager/package.json packages/sss-key-manager/
COPY packages/email-templates/package.json packages/email-templates/
COPY apps/scouts/package.json apps/scouts/
COPY examples/chapi-example/package.json examples/chapi-example/
COPY examples/consent-flow-test/package.json examples/consent-flow-test/
COPY examples/credential-viewer/package.json examples/credential-viewer/
COPY examples/embed-example/package.json examples/embed-example/
COPY examples/openid4vc-playground/package.json examples/openid4vc-playground/
COPY examples/snap-chapi-example/package.json examples/snap-chapi-example/
COPY examples/snap-example-dapp/package.json examples/snap-example-dapp/
COPY examples/app-store-apps/1-basic-launchpad-app/package.json examples/app-store-apps/1-basic-launchpad-app/
COPY examples/app-store-apps/2-lore-card-app/package.json examples/app-store-apps/2-lore-card-app/
COPY examples/app-store-apps/3-mozilla-social-badges-app/package.json examples/app-store-apps/3-mozilla-social-badges-app/
COPY examples/app-store-apps/4-request-learner-context-app/package.json examples/app-store-apps/4-request-learner-context-app/
COPY examples/app-store-apps/5-northstar-learning/package.json examples/app-store-apps/5-northstar-learning/
COPY packages/holder-continuity-bundle/package.json packages/holder-continuity-bundle/
COPY packages/learn-card-bridge-http/package.json packages/learn-card-bridge-http/
COPY packages/learn-card-cli/package.json packages/learn-card-cli/
COPY packages/learn-card-partner-connect-sdk/package.json packages/learn-card-partner-connect-sdk/
COPY packages/plugins/claimable-boosts/package.json packages/plugins/claimable-boosts/
COPY packages/render-method-templates/package.json packages/render-method-templates/
COPY services/learn-card-discord-bot/package.json services/learn-card-discord-bot/
COPY services/meta-mask-snap/package.json services/meta-mask-snap/
COPY services/playwright-delete-service/package.json services/playwright-delete-service/
COPY tests/benchmarking/package.json tests/benchmarking/
COPY tests/e2e/package.json tests/e2e/
COPY tests/federation-e2e/package.json tests/federation-e2e/
COPY tests/openid4vc-e2e/package.json tests/openid4vc-e2e/
COPY tests/openid4vc-interop-e2e/package.json tests/openid4vc-interop-e2e/
COPY tests/smoketests/package.json tests/smoketests/
COPY tools/executors/workspace/run-command tools/executors/workspace/run-command

# Install dependencies - done before copying source for caching
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts --frozen-lockfile

# Copy all workspace source. The docker-build script resolves @learncard/* from TS
# source (VITE_DOCKER_SOURCE=true), so vite bundles the app in a single pass with no
# per-package dist build; .dockerignore excludes node_modules/dist/build.
COPY . .

RUN rm -rf node_modules/.cache/nx

ENV NX_DAEMON=false

RUN bunx nx docker-build learn-card-app

# Expose the port the app runs on
EXPOSE 3000

# Serve the app
CMD ["sh", "-c", "cd apps/learn-card-app && bun run preview"]
