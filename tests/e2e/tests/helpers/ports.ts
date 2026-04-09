import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Centralized port configuration for E2E tests.
 *
 * Two modes of operation:
 *
 * 1. **Direct mode** (default): each service gets its own host port.
 *    Uses PORT_OFFSET to shift all ports (e2e scripts default to 100).
 *    Override with PORT_OFFSET=0 if running e2e in isolation.
 *
 * 2. **Proxy mode**: set PROXY_PORT to route all HTTP services through
 *    a single Caddy reverse proxy (like the preview environment).
 *    DB services still use direct host ports with PORT_OFFSET.
 *    Example: PROXY_PORT=8081 pnpm run test:e2e
 *
 * NOTE: Base ports are also defined in:
 *   - scripts/dc.sh                (bash, for Docker host ports)
 *   - compose files via ${VAR:-N}  (YAML fallbacks)
 * If you add or change a base port here, update those files too.
 */

const OFFSET = Number(process.env.PORT_OFFSET ?? 0);

/**
 * Resolve the proxy port. Priority:
 *   1. PROXY_PORT env var (explicit override)
 *   2. .proxy-port file written by dc.sh (auto-detected port)
 *      — only checked when PORT_OFFSET is NOT set, so direct-mode
 *        scripts (which set PORT_OFFSET=100) never accidentally
 *        enter proxy mode from a stale file.
 */
function getProxyPort(): number | undefined {
    if (process.env.PROXY_PORT) return Number(process.env.PROXY_PORT);

    if (!process.env.PORT_OFFSET) {
        try {
            const portFile = resolve(process.cwd(), '.proxy-port');

            const raw = readFileSync(portFile, 'utf-8').trim();

            return raw ? Number(raw) : undefined;
        } catch {
            return undefined;
        }
    }

    return undefined;
}

const PROXY_PORT = getProxyPort();

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
    proxy: PROXY_PORT,
} as const;

const proxyBase = PROXY_PORT ? `http://localhost:${PROXY_PORT}` : undefined;

export const URLS = {
    brainTrpc: proxyBase ? `${proxyBase}/brain/trpc` : `http://localhost:${PORTS.brain}/trpc`,
    brainApi: proxyBase ? `${proxyBase}/brain/api` : `http://localhost:${PORTS.brain}/api`,
    brainHealthCheck: proxyBase ? `${proxyBase}/brain/api/health-check` : `http://localhost:${PORTS.brain}/api/health-check`,
    brainClearCache: proxyBase ? `${proxyBase}/brain/test/clear-cache` : `http://localhost:${PORTS.brain}/test/clear-cache`,

    cloudTrpc: proxyBase ? `${proxyBase}/cloud/trpc` : `http://localhost:${PORTS.cloud}/trpc`,
    cloudHealthCheck: proxyBase ? `${proxyBase}/cloud/api/health-check` : `http://localhost:${PORTS.cloud}/api/health-check`,
    cloudClearCache: proxyBase ? `${proxyBase}/cloud/test/clear-cache` : `http://localhost:${PORTS.cloud}/test/clear-cache`,

    signingTrpc: proxyBase ? `${proxyBase}/signing/trpc` : `http://localhost:${PORTS.signing}/trpc`,
    signingClearCache: proxyBase ? `${proxyBase}/signing/test/clear-cache` : `http://localhost:${PORTS.signing}/test/clear-cache`,

    lcaApiTrpc: proxyBase ? `${proxyBase}/lca-api/trpc` : `http://localhost:${PORTS.lcaApi}/trpc`,
    lcaApiHealthCheck: proxyBase ? `${proxyBase}/lca-api/api/health-check` : `http://localhost:${PORTS.lcaApi}/api/health-check`,

    inboxIssue: proxyBase ? `${proxyBase}/brain/api/inbox/issue` : `http://localhost:${PORTS.brain}/api/inbox/issue`,

    brainBase: proxyBase ? `${proxyBase}/brain` : `http://localhost:${PORTS.brain}`,
    cloudBase: proxyBase ? `${proxyBase}/cloud` : `http://localhost:${PORTS.cloud}`,
    lcaApiBase: proxyBase ? `${proxyBase}/lca-api` : `http://localhost:${PORTS.lcaApi}`,
    cloudXapi: proxyBase ? `${proxyBase}/cloud/xapi` : `http://localhost:${PORTS.cloud}/xapi`,

    // DB URLs always use direct ports (raw TCP, not HTTP-proxyable)
    neo4jBolt: `bolt://localhost:${PORTS.neo4jBolt}`,
    mongo: `mongodb://localhost:${PORTS.mongo}`,
} as const;
