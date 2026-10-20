FROM docker:29-cli AS dockercli
FROM oven/bun:1.3.11 AS build
WORKDIR /build
COPY services/learn-card-network/workload-agent/package.json ./package.json
RUN bun install --production --ignore-scripts
COPY packages/learn-card-types/src ./packages/learn-card-types/src
COPY services/learn-card-network/workload-agent/src ./services/learn-card-network/workload-agent/src
COPY services/learn-card-network/workload-agent/test/fixtures.ts ./services/learn-card-network/workload-agent/test/fixtures.ts
COPY services/learn-card-network/workload-agent/test/smoke-runner.ts ./services/learn-card-network/workload-agent/test/smoke-runner.ts
RUN bun build services/learn-card-network/workload-agent/src/index.ts services/learn-card-network/workload-agent/test/smoke-runner.ts --target=bun --outdir=/out

FROM oven/bun:1.3.11
COPY --from=dockercli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=dockercli /usr/local/libexec/docker/cli-plugins/docker-compose /usr/local/libexec/docker/cli-plugins/docker-compose
COPY --from=build /out /app
WORKDIR /app
ENV NODE_ENV=development
CMD ["bun", "/app/src/index.js"]
