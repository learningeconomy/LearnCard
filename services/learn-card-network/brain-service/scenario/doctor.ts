/**
 * `scenario doctor`: checks the live dev stack before a walkthrough, each with a fix hint.
 * Requires bootstrapScenarioEnv() to have run (SEED, NEO4J_* defaults, cwd).
 */
import { readdir, stat } from 'node:fs/promises';
import { createConnection, createServer } from 'node:net';
import { join } from 'node:path';
import { z } from 'zod';
import { applyLiveRedisDefaults, REPO_ROOT, scenarioOrigins } from './env';
import { toScenarioError } from './core/expect';
import { ROOT_ECOSYSTEM_ID } from './core/ids';
import { ConsoleClient } from './drivers/live/bff-client';

export type DoctorStatus = 'PASS' | 'WARN' | 'FAIL';

export type DoctorCheck = { name: string; status: DoctorStatus; detail: string; fix?: string };

const pass = (name: string, detail: string): DoctorCheck => ({ name, status: 'PASS', detail });
const fail = (name: string, detail: string, fix: string): DoctorCheck => ({
    name,
    status: 'FAIL',
    detail,
    fix,
});
const warn = (name: string, detail: string, fix: string): DoctorCheck => ({
    name,
    status: 'WARN',
    detail,
    fix,
});

const fetchWithTimeout = (url: string, init: RequestInit = {}): Promise<Response> =>
    fetch(url, { ...init, signal: AbortSignal.timeout(5_000) });

const errorText = (error: unknown): string => toScenarioError(error).message;

const httpCheck = async (
    name: string,
    url: string,
    fix: string,
    accept: (response: Response) => Promise<boolean> = async response => response.ok
): Promise<DoctorCheck> => {
    try {
        const response = await fetchWithTimeout(url);
        return (await accept(response))
            ? pass(name, `${url} → ${response.status}`)
            : fail(name, `${url} → ${response.status}`, fix);
    } catch (error) {
        return fail(name, `${url}: ${errorText(error)}`, fix);
    }
};

const checkNotProduction = (): DoctorCheck =>
    process.env.NODE_ENV === 'production'
        ? fail('not production', 'NODE_ENV=production', 'The runner is dev-only; unset NODE_ENV.')
        : pass('not production', `NODE_ENV=${process.env.NODE_ENV ?? '(unset)'}`);

const checkSeed = async (brain: string): Promise<DoctorCheck> => {
    const name = 'SEED matches brain';
    const fix =
        'Run the runner with the SEED brain uses (compose-local sets SEED: a; the package script defaults it).';
    try {
        // The same helper brain's installIntent.integrationSigningKey route returns.
        const { serviceAccountSigningPublicKey } =
            await import('@helpers/service-account-auth.helpers');
        const local = serviceAccountSigningPublicKey().x;
        const response = await fetchWithTimeout(
            `${brain}/trpc/installIntent.integrationSigningKey?input=${encodeURIComponent('{}')}`
        );
        const remote = z
            .object({ result: z.object({ data: z.object({ x: z.string() }) }) })
            .parse(await response.json()).result.data.x;
        return remote === local
            ? pass(name, 'platform signing key matches')
            : fail(name, 'local platform signing key differs from brain’s', fix);
    } catch (error) {
        return fail(name, errorText(error), `${fix} (brain must be up to compare)`);
    }
};

const checkNeo4j = async (): Promise<DoctorCheck> => {
    const name = 'neo4j bolt';
    const uri = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
    const { auth, driver: createDriver } = await import('neo4j-driver');
    const driver = createDriver(
        uri,
        auth.basic(process.env.NEO4J_USERNAME ?? 'neo4j', process.env.NEO4J_PASSWORD ?? '')
    );
    try {
        await driver.getServerInfo();
        return pass(name, uri);
    } catch (error) {
        const message = errorText(error);
        const auth = /auth|credential|unauthori/i.test(message);
        return fail(
            name,
            `${uri}: ${message}`,
            auth
                ? "Password mismatch: seed-dev-all defaults NEO4J_PASSWORD to 'password', the other scripts to 'this-is-the-password'; export the one your neo4j uses."
                : 'Start neo4j (compose-local `neo4j`, healthy after up to ~200 s).'
        );
    } finally {
        await driver.close();
    }
};

const checkRedis = async (): Promise<DoctorCheck[]> => {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT || 6379);
    const ping = await new Promise<string>(resolve => {
        const socket = createConnection({ host, port });
        const done = (result: string): void => {
            socket.destroy();
            resolve(result);
        };
        socket.setTimeout(2_000, () => done('timeout'));
        socket.on('error', error => done(error.message));
        socket.on('connect', () => socket.write('PING\r\n'));
        socket.on('data', data => done(data.toString().trim()));
    });
    const checks: DoctorCheck[] = [
        ping === '+PONG'
            ? pass('redis PING', `${host}:${port} PONG`)
            : fail(
                  'redis PING',
                  `${host}:${port}: ${ping}`,
                  'Start redis (compose-local `redis`, port 6379).'
              ),
    ];
    if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
        checks.push(
            warn(
                'runner shares brain Redis',
                'REDIS_HOST/REDIS_PORT are set empty for the runner, so its probe locks are process-local',
                'Unset REDIS_HOST/REDIS_PORT (the runner defaults to localhost:6379) so the on-demand probe and brain’s scheduler share locks.'
            )
        );
    }
    return checks;
};

const checkConsole = async (consoleOrigin: string): Promise<DoctorCheck[]> => {
    const client = new ConsoleClient(consoleOrigin);
    try {
        await client.login();
    } catch (error) {
        return [
            fail(
                'console dev login',
                errorText(error),
                'Start console-bff with CONSOLE_BFF_DEV_INSECURE_AUTH=true (its `bun run dev` sets it).'
            ),
        ];
    }
    const checks = [pass('console dev login', 'session established')];
    try {
        // session.get overlays brain's live MEMBER_OF edges on the login-time grants;
        // ecosystem.list only shows the login-time grant.
        const session = z
            .object({
                effectiveAccess: z.object({
                    ecosystemRoles: z.array(
                        z.object({ ecosystemId: z.string(), role: z.string() })
                    ),
                }),
            })
            .passthrough()
            .parse(await client.query('session.get'));
        const role = session.effectiveAccess.ecosystemRoles.find(
            entry => entry.ecosystemId === ROOT_ECOSYSTEM_ID
        )?.role;
        checks.push(
            role === 'OWNER' || role === 'ADMIN'
                ? pass('operator role on eco_dev_root', role)
                : warn(
                      'operator role on eco_dev_root',
                      role ? `role ${role}` : 'no membership',
                      'F1 grants the console operator OWNER; otherwise run `bun run seed:education-os` with DEV_OPERATOR_PROFILE_ID set to the console operator’s profile.'
                  )
        );
    } catch (error) {
        checks.push(
            fail('operator role on eco_dev_root', errorText(error), 'Check console-bff logs.')
        );
    }
    return checks;
};

const checkPortFree = async (port: number): Promise<DoctorCheck> => {
    const name = `port ${port} free`;
    const free = await new Promise<boolean | string>(resolve => {
        const server = createServer();
        server.once('error', (error: NodeJS.ErrnoException) =>
            resolve(error.code === 'EADDRINUSE' ? false : error.message)
        );
        server.listen(port, 'localhost', () => server.close(() => resolve(true)));
    });
    if (free === true) return pass(name, 'the runner can spawn its demo LMS here');
    return fail(
        name,
        free === false ? 'in use' : free,
        `Stop the old LMS on :${port} (the runner spawns its own), or set DEMO_LMS_PORT to a free port.`
    );
};

const newestMtime = async (path: string): Promise<number> => {
    let newest = 0;
    let entries;
    try {
        entries = await readdir(path, { withFileTypes: true });
    } catch {
        return 0;
    }
    for (const entry of entries) {
        if (entry.name === 'node_modules') continue;
        const full = join(path, entry.name);
        newest = Math.max(
            newest,
            entry.isDirectory() ? await newestMtime(full) : (await stat(full)).mtimeMs
        );
    }
    return newest;
};

/** `nxProject` is the project.json name (`bunx nx build <nxProject>`), not the npm name. */
const DIST_PACKAGES: { name: string; nxProject: string; dir: string }[] = [
    { name: '@learncard/types', nxProject: 'types', dir: 'packages/learn-card-types' },
    { name: '@learncard/init', nxProject: 'init', dir: 'packages/learn-card-init' },
    {
        name: '@learncard/network-plugin',
        nxProject: 'network-plugin',
        dir: 'packages/plugins/learn-card-network',
    },
    {
        name: '@learncard/network-brain-client',
        nxProject: 'network-brain-client',
        dir: 'packages/learn-card-network/brain-client',
    },
];

const checkDist = async (): Promise<DoctorCheck[]> => {
    const wasm = join(REPO_ROOT, 'packages/plugins/didkit/dist/didkit_wasm_bg.wasm');
    const checks: DoctorCheck[] = [];
    try {
        await stat(wasm);
        checks.push(pass('didkit wasm', 'present in dist'));
    } catch {
        checks.push(
            fail('didkit wasm', `${wasm} missing`, 'Build it: bunx nx build didkit-plugin.')
        );
    }
    for (const pkg of DIST_PACKAGES) {
        const src = await newestMtime(join(REPO_ROOT, pkg.dir, 'src'));
        const dist = await newestMtime(join(REPO_ROOT, pkg.dir, 'dist'));
        checks.push(
            dist >= src
                ? pass(`${pkg.name} dist`, 'not older than src')
                : warn(
                      `${pkg.name} dist`,
                      dist ? 'dist is older than src' : 'no dist',
                      `console-bff reads dist: rebuild (bunx nx build ${pkg.nxProject}) and restart console-bff.`
                  )
        );
    }
    return checks;
};

export const runDoctor = async (): Promise<DoctorCheck[]> => {
    // Check the environment the live driver runs with, not the bare shell's.
    applyLiveRedisDefaults();
    const origins = scenarioOrigins();
    const [seed, neo4j, redis, brain, lcaApi, bff, consoleHealth, port, dist] = await Promise.all([
        checkSeed(origins.brain),
        checkNeo4j(),
        checkRedis(),
        httpCheck(
            'brain',
            `${origins.brain}/api/health-check`,
            'Start brain (compose-local `brain`, with INTEGRATION_HEALTH_ALLOW_LOCALHOST_HTTP=true).'
        ),
        httpCheck(
            'lca-api',
            `${origins.lcaApi}/api/health-check`,
            'Start the api service on :5100 (docker compose -f apps/learn-card-app/compose-local.yaml up api).'
        ),
        httpCheck('console-bff', `${origins.bff}/health`, 'Start console-bff on :3200.'),
        httpCheck(
            'console + proxy',
            `${origins.console}/health`,
            'Start console-web on :5173 (it proxies /health, /auth and /trpc to the BFF).'
        ),
        checkPortFree(origins.demoLmsPort),
        checkDist(),
    ]);
    const consoleChecks =
        consoleHealth.status === 'PASS' ? await checkConsole(origins.console) : [];

    return [
        checkNotProduction(),
        seed,
        neo4j,
        ...redis,
        brain,
        lcaApi,
        bff,
        consoleHealth,
        ...consoleChecks,
        port,
        ...dist,
    ];
};

export const doctorStatus = (checks: readonly DoctorCheck[]): DoctorStatus =>
    checks.some(check => check.status === 'FAIL')
        ? 'FAIL'
        : checks.some(check => check.status === 'WARN')
          ? 'WARN'
          : 'PASS';
