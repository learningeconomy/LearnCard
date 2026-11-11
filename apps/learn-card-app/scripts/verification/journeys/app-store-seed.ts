import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import type { FileHandle } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { REPO_ROOT } from '../constants';
import { registerAuxiliaryProcess, stopAuxiliaryProcess } from '../stack';
import type { VerificationContext } from '../types';

const MIN_NODE = [22, 12];

/**
 * Astro 7 refuses Node < 22.12 (the repo pins 24.12 in .nvmrc). Shells often have an older
 * system `node` ahead of fnm/nvm on PATH, so resolve one explicitly and fail with the fix.
 */
const resolveNode = (): string => {
    const candidates = [process.env.LC_VERIFY_NODE, 'node'].filter(Boolean) as string[];
    for (const candidate of candidates) {
        const result = spawnSync(candidate, ['--version'], {
            encoding: 'utf8',
            env: { NODE_ENV: 'development', PATH: process.env.PATH },
        });
        const [major = 0, minor = 0] = (result.stdout ?? '')
            .replace(/^v/, '')
            .split('.')
            .map(Number);
        if (major > MIN_NODE[0]! || (major === MIN_NODE[0] && minor >= MIN_NODE[1]!))
            return candidate;
    }
    throw new Error(
        'The app-store journey runs the Astro example, which needs Node >= 22.12 (repo pins 24.12; see .nvmrc). ' +
            'Put it first on PATH (e.g. `fnm use`) or set LC_VERIFY_NODE=/path/to/node.'
    );
};

type Exit = { code: number | null; error?: Error };
type OwnedChild = {
    child: ChildProcess;
    exited: Promise<Exit>;
    log: FileHandle;
    stackDirectory: string;
};

export interface VerificationListing {
    listingId: string;
    displayName: string;
    appUrl: string;
    issuerDid: string;
    stop: () => Promise<void>;
}

const startChild = async (
    command: string,
    args: string[],
    cwd: string,
    env: NodeJS.ProcessEnv,
    logPath: string,
    stackDirectory: string
): Promise<OwnedChild> => {
    const log = await open(logPath, 'wx', 0o600);
    let child: ChildProcess;
    try {
        child = spawn(command, args, {
            cwd,
            env,
            detached: true,
            stdio: ['ignore', log.fd, log.fd],
        });
    } catch (error) {
        await log.close();
        throw error;
    }
    const exited = new Promise<Exit>(resolveExit => {
        child.once('error', error => resolveExit({ code: null, error }));
        child.once('exit', code => resolveExit({ code }));
    });
    try {
        await new Promise<void>((resolveSpawn, reject) => {
            child.once('spawn', resolveSpawn);
            child.once('error', reject);
        });
        await registerAuxiliaryProcess(stackDirectory, child.pid!);
        return { child, exited, log, stackDirectory };
    } catch (error) {
        if (child.pid && child.exitCode === null && child.signalCode === null) {
            child.kill('SIGKILL');
        }
        await exited;
        await log.close();
        throw error;
    }
};

const stopChild = async ({ child, exited, log, stackDirectory }: OwnedChild): Promise<void> => {
    try {
        if (child.pid) await stopAuxiliaryProcess(stackDirectory, child.pid);
        await exited;
    } finally {
        await log.close();
    }
};

const assertPortFree = async (port: number, host: string): Promise<void> => {
    const server = createServer();
    await new Promise<void>((resolveListen, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => resolveListen());
    });
    await new Promise<void>((resolveClose, reject) => {
        server.close(error => (error ? reject(error) : resolveClose()));
    });
};

const awaitApp = async (owned: OwnedChild, appOrigin: string): Promise<void> => {
    let exit: Exit | undefined;
    void owned.exited.then(result => {
        exit = result;
    });
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
        if (exit) {
            throw (
                exit.error ??
                new Error(`Partner app exited (${exit.code}); inspect app-store-app.log`)
            );
        }
        try {
            const response = await fetch(appOrigin, { signal: AbortSignal.timeout(5_000) });
            if (response.ok && (await response.text()).includes('LearnCard Partner App Demo')) {
                return;
            }
        } catch {
            // The actual Astro application is still starting; no substitute server is used.
        }
        await delay(500);
    }
    throw new Error('Real partner app did not become ready; inspect app-store-app.log');
};

/** Seed data only; installation and Partner Connect identity are exercised through the UI. */
export const startVerificationListing = async (
    context: VerificationContext,
    /** Listing title; defaults to a unique run-scoped name. Must be unique per stack. */
    name?: string
): Promise<VerificationListing> => {
    const { stack, stackDirectory } = context;
    const appOrigin = stack.partner;
    await assertPortFree(stack.ports.partner, new URL(appOrigin).hostname);
    const privateEnvDir = resolve(context.artifactsDir, 'app-store-env');
    await mkdir(privateEnvDir, { recursive: true, mode: 0o700 });
    const exampleDir = resolve(REPO_ROOT, 'examples/app-store-apps/1-basic-launchpad-app');
    const issuer = context.newActor('partner-backend');
    // The example issues immediately after init, before a profile lookup selects did:web.
    // Compare its signing-key identity, derived independently from the supplied disposable seed.
    const issuerDid = (await context.sdk(issuer)).id.did('key');
    // Use Astro's real dev server directly, keeping the server and its shutdown handler in one PID.
    // Both the Astro config and this override disable developer .env loading.
    const serverScript = `
import { dev } from 'astro';
const server = await dev({
    root: process.cwd(),
    envDir: ${JSON.stringify(privateEnvDir)},
    cacheDir: ${JSON.stringify(resolve(context.artifactsDir, 'app-store-cache'))},
    server: { host: ${JSON.stringify(new URL(appOrigin).hostname)}, port: ${stack.ports.partner} },
    vite: {
        envDir: false,
        cacheDir: ${JSON.stringify(resolve(context.artifactsDir, 'app-store-vite-cache'))},
        server: { strictPort: true },
    },
});
let stopping = false;
const stop = async () => {
    if (stopping) return;
    stopping = true;
    await server.stop();
    process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
`;
    const app = await startChild(
        resolveNode(),
        ['--input-type=module', '--eval', serverScript],
        exampleDir,
        {
            PATH: process.env.PATH,
            HOME: privateEnvDir,
            NODE_ENV: 'development',
            ASTRO_TELEMETRY_DISABLED: '1',
            LC_VERIFICATION: '1',
            PUBLIC_LEARNCARD_ORIGIN: stack.app,
            LEARNCARD_NETWORK_URL: stack.brain,
            LEARNCARD_CLOUD_URL: stack.cloud,
            LEARNCARD_ISSUER_SEED: issuer.seed,
        },
        resolve(context.artifactsDir, 'app-store-app.log'),
        stackDirectory
    );
    try {
        await awaitApp(app, appOrigin);
        const suffix = randomUUID().slice(0, 12);
        const slug = `lc-verify-${suffix}`;
        const displayName = name ?? `LC Verify ${context.runId} ${suffix}`;
        const seedLog = resolve(context.artifactsDir, 'app-store-seed.log');
        const seed = await startChild(
            'bun',
            [
                '--no-env-file',
                'run',
                resolve(
                    REPO_ROOT,
                    'services/learn-card-network/brain-service/scripts/seed-dev-app.ts'
                ),
                '--app-url',
                appOrigin,
                '--app-name',
                displayName,
                '--slug',
                slug,
                '--profile',
                slug,
                '--app-image',
                `${appOrigin}/favicon.svg`,
                '--permissions',
                'request_identity',
                '--launch-type',
                'EMBEDDED_IFRAME',
                '--promotion',
                'STANDARD',
                '--sa-endpoint',
                new URL('/api', stack.lcaApi).href,
            ],
            privateEnvDir,
            {
                NODE_ENV: 'development',
                PATH: process.env.PATH,
                HOME: privateEnvDir,
                NEO4J_URI: `bolt://${new URL(stack.brain).hostname}:${stack.ports.neo4j}`,
                NEO4J_USERNAME: 'neo4j',
                NEO4J_PASSWORD: 'this-is-the-password',
                MONGO_URI: `mongodb://${new URL(stack.cloud).hostname}:${stack.ports.mongo}/?replicaSet=rs0&directConnection=true`,
                MONGO_DB_NAME: 'lca-api',
                DOMAIN_NAME: encodeURIComponent(new URL(stack.brain).host),
            },
            seedLog,
            stackDirectory
        );
        try {
            const result = await Promise.race([
                seed.exited,
                delay(90_000, undefined, { ref: false }).then(() => {
                    throw new Error('App-store seed timed out; inspect app-store-seed.log');
                }),
            ]);
            if (result.error || result.code !== 0) {
                throw (
                    result.error ??
                    new Error(`App-store seed exited (${result.code}); inspect app-store-seed.log`)
                );
            }
        } finally {
            await stopChild(seed);
        }
        const output = await readFile(seedLog, 'utf8');
        const listingId = output.match(/Listing ID:\s+([\da-f-]{36})/i)?.[1];
        if (!listingId || /Could not connect|skipping SA setup/i.test(output)) {
            throw new Error(
                'App-store seed did not complete all prerequisites; inspect app-store-seed.log'
            );
        }
        await writeFile(
            resolve(context.artifactsDir, 'app-store-listing.json'),
            JSON.stringify(
                {
                    listingId,
                    slug,
                    displayName,
                    appUrl: appOrigin,
                    issuerDid,
                    childPid: app.child.pid,
                    permissions: ['request_identity'],
                },
                null,
                2
            ),
            { mode: 0o600 }
        );
        return { listingId, displayName, appUrl: appOrigin, issuerDid, stop: () => stopChild(app) };
    } catch (error) {
        await stopChild(app);
        throw error;
    }
};
