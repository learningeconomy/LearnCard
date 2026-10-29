/**
 * Process environment for the scenario runner. Call `bootstrapScenarioEnv()` before the
 * first dynamic `import('@instance')` (or anything that loads `@environment`): brain reads
 * its environment, and `dotenv` its `.env`, once at module load and relative to the cwd.
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BRAIN_SERVICE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = resolve(BRAIN_SERVICE_DIR, '../../..');
export const DEMO_LMS_DIR = join(REPO_ROOT, 'examples/demo-lms');

/** The brain SEED the local compose stack runs with (`SEED: a`). */
export const LOCAL_BRAIN_SEED = 'a';
export const LOCAL_DOMAIN_NAME = 'localhost%3A4000';

/**
 * The runner spawns its own demo LMS. 4321 is the port a developer's hand-started demo LMS
 * uses, so the runner defaults to the next one and never fights over it.
 */
export const DEFAULT_SCENARIO_DEMO_LMS_PORT = 4322;

export type ScenarioOrigins = {
    console: string;
    bff: string;
    brain: string;
    lcaApi: string;
    demoLmsPort: number;
    demoLms: string;
};

export const assertNotProduction = (): void => {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('The scenario runner is dev-only and refuses NODE_ENV=production.');
    }
};

export const scenarioOrigins = (): ScenarioOrigins => {
    const demoLmsPort = Number(process.env.DEMO_LMS_PORT ?? DEFAULT_SCENARIO_DEMO_LMS_PORT);
    if (!Number.isInteger(demoLmsPort) || demoLmsPort <= 0 || demoLmsPort > 65_535) {
        throw new Error(`DEMO_LMS_PORT must be a TCP port, got ${process.env.DEMO_LMS_PORT}.`);
    }

    return {
        console: process.env.CONSOLE_ORIGIN ?? 'http://localhost:5173',
        bff: process.env.BFF_ORIGIN ?? 'http://localhost:3200',
        brain: process.env.BRAIN_ORIGIN ?? 'http://localhost:4000',
        lcaApi: process.env.LCA_API_ORIGIN ?? 'http://localhost:5100',
        demoLmsPort,
        // Brain only probes plain http on the hostname `localhost` (not 127.0.0.1).
        demoLms: `http://localhost:${demoLmsPort}`,
    };
};

/**
 * The live driver's on-demand probe takes brain's reconciler locks, so the runner shares
 * brain's Redis (compose-local maps it to localhost:6379) rather than process-local locks.
 * Call before any brain module loads (they read the environment once). Shared by the live
 * driver and `scenario doctor`, so the doctor checks the environment the driver uses.
 */
export const applyLiveRedisDefaults = (): void => {
    process.env.REDIS_HOST ??= 'localhost';
    process.env.REDIS_PORT ??= '6379';
};

/**
 * Idempotent. Defaults only fill gaps; an explicit environment always wins. Bun loads
 * brain-service/.env into process.env before any code runs, so the package script pins
 * SEED=a itself (a .env SEED would otherwise win and fail the doctor's SEED check).
 */
export const bootstrapScenarioEnv = (): void => {
    assertNotProduction();
    process.chdir(BRAIN_SERVICE_DIR);

    // Some ambient typings mark NODE_ENV read-only.
    if (!process.env.NODE_ENV) Object.assign(process.env, { NODE_ENV: 'development' });
    process.env.SEED ??= LOCAL_BRAIN_SEED;
    process.env.DOMAIN_NAME ??= LOCAL_DOMAIN_NAME;
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.SKIP_DIDKIT_NAPI ??= 'true';
    // The runner probes the demo LMS from this process (src/dev/service-account-health-probe).
    process.env.INTEGRATION_HEALTH_ALLOW_LOCALHOST_HTTP = 'true';
    // Never start a second reconciler scheduler next to the running brain.
    process.env.INSTALL_INTENT_RECONCILER_SCHEDULER_DISABLED = 'true';

    // NODE_ENV may have come from the caller's shell; re-check after defaults.
    assertNotProduction();
};
