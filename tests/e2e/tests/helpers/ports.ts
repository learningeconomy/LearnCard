/**
 * Centralized port configuration for E2E tests.
 *
 * Reads PORT_OFFSET from the environment (default 0) and computes every
 * service URL from it. All test code should import from here instead of
 * hard-coding `localhost:XXXX`.
 *
 * When running with the default offset nothing changes — URLs resolve to the
 * same ports the project has always used.
 *
 * NOTE: Base ports are also defined in:
 *   - scripts/dc.sh                (bash, for Docker host ports)
 *   - compose files via ${VAR:-N}  (YAML fallbacks)
 * If you add or change a base port here, update those files too.
 */

const OFFSET = Number(process.env.PORT_OFFSET ?? 0);

export const PORTS = {
    brain: 4000 + OFFSET,
    cloud: 4100 + OFFSET,
    signing: 4200 + OFFSET,
    lcaApi: 5200 + OFFSET,
    neo4jBolt: 7687 + OFFSET,
    neo4jHttp: 7474 + OFFSET,
    redis1: 6379 + OFFSET,
    redis2: 6380 + OFFSET,
    redis3: 6381 + OFFSET,
    mongo: 27017 + OFFSET,
    postgres: 5432 + OFFSET,
    dccCoordinator: 4005 + OFFSET,
} as const;

export const URLS = {
    brainTrpc: `http://localhost:${PORTS.brain}/trpc`,
    brainApi: `http://localhost:${PORTS.brain}/api`,
    brainHealthCheck: `http://localhost:${PORTS.brain}/api/health-check`,
    brainClearCache: `http://localhost:${PORTS.brain}/test/clear-cache`,

    cloudTrpc: `http://localhost:${PORTS.cloud}/trpc`,
    cloudHealthCheck: `http://localhost:${PORTS.cloud}/api/health-check`,
    cloudClearCache: `http://localhost:${PORTS.cloud}/test/clear-cache`,

    signingTrpc: `http://localhost:${PORTS.signing}/trpc`,
    signingClearCache: `http://localhost:${PORTS.signing}/test/clear-cache`,

    lcaApiTrpc: `http://localhost:${PORTS.lcaApi}/trpc`,
    lcaApiHealthCheck: `http://localhost:${PORTS.lcaApi}/api/health-check`,

    inboxIssue: `http://localhost:${PORTS.brain}/api/inbox/issue`,

    brainBase: `http://localhost:${PORTS.brain}`,
    cloudBase: `http://localhost:${PORTS.cloud}`,
    lcaApiBase: `http://localhost:${PORTS.lcaApi}`,
    cloudXapi: `http://localhost:${PORTS.cloud}/xapi`,

    neo4jBolt: `bolt://localhost:${PORTS.neo4jBolt}`,
    mongo: `mongodb://localhost:${PORTS.mongo}`,
} as const;
