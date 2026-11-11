import { spawn, execFile } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { createServer as createSocket } from 'node:net';
import { mkdir, readFile, writeFile, rm, open } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const exec = promisify(execFile);
const require = createRequire(import.meta.url);
// Keep the single-worker cleanup contract; arbitrary Playwright config/worker
// overrides could otherwise make one test clear another test's Redis state.
const testArgs = process.argv.slice(2);
for (let index = 0; index < testArgs.length; index++) {
    const option = testArgs[index];
    if (option === '--headed') continue;
    if ((option === '--grep' || option === '--grep-invert') && testArgs[++index]) continue;
    throw new Error('Supported options: --headed, --grep <pattern>, --grep-invert <pattern>');
}
const here = dirname(fileURLToPath(import.meta.url));
const service = resolve(here, '../..');
const repo = resolve(service, '../../..');
// Fixed project + exclusive lock bounds this suite's resources.
// After SIGKILL, stop all suite processes and remove a stale lock manually.
// Once locked, the next run reaps the stale stack. No shared dev volumes.
const project = 'learncard-oidc-e2e';
const lockPath = join(tmpdir(), `${project}.lock`);
const composeArgs = ['compose', '-p', project, '-f', join(here, 'compose.yaml')];
let temp;
let api;
let playwright;
let callback;
let composeEnv;
let cleaned;
let ownsLock = false;
let interrupted = false;
let apiStartupError;

const assertRunning = () => {
    if (interrupted) throw new Error('OIDC E2E interrupted');
};

const compose = (...args) =>
    exec('docker', [...composeArgs, ...args], {
        env: composeEnv ?? process.env,
        timeout: 180_000,
        maxBuffer: 4 * 1024 * 1024,
    });

const acquireLock = async () => {
    try {
        const file = await open(lockPath, 'wx', 0o600);
        await file.writeFile(String(process.pid));
        await file.close();
        ownsLock = true;
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        const pid = Number(await readFile(lockPath, 'utf8'));
        if (!Number.isInteger(pid) || pid <= 0)
            throw new Error(`Inspect stale lock: ${lockPath}`, { cause: error });
        try {
            process.kill(pid, 0);
        } catch (probe) {
            if (probe.code !== 'ESRCH') throw probe;
            throw new Error(
                `Stale OIDC E2E lock at ${lockPath} (PID ${pid}). Stop all OIDC E2E invocations and their child processes, remove this lock manually, then rerun.`,
                { cause: probe }
            );
        }
        throw new Error(`OIDC E2E is already running (PID ${pid}); refusing to share its data.`, {
            cause: error,
        });
    }
};

const freePort = async () => {
    const socket = createSocket();
    socket.listen(0, '0.0.0.0');
    await once(socket, 'listening');
    const { port } = socket.address();
    await new Promise((resolve, reject) =>
        socket.close(error => (error ? reject(error) : resolve()))
    );
    return port;
};

const stop = async child => {
    if (!child?.pid || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    const timer = setTimeout(() => child.kill('SIGKILL'), 5_000);
    try {
        await exited;
    } finally {
        clearTimeout(timer);
    }
};

const cleanup = () =>
    (cleaned ??= (async () => {
        const errors = [];
        for (const action of [
            () => stop(playwright),
            () => stop(api),
            async () => {
                if (callback) {
                    callback.closeAllConnections();
                    await new Promise(resolve => callback.close(resolve));
                }
            },
            async () => {
                if (ownsLock) await compose('down', '--volumes', '--remove-orphans');
            },
            async () => {
                if (temp) await rm(temp, { recursive: true, force: true });
            },
            async () => {
                if (ownsLock) await rm(lockPath, { force: true });
            },
        ]) {
            try {
                await action();
            } catch (error) {
                errors.push(error);
            }
        }
        if (errors.length) throw new AggregateError(errors, 'OIDC E2E cleanup failed');
        if (ownsLock)
            console.log(
                'OIDC E2E cleanup complete: containers, data, callback, and temp files removed.'
            );
    })());

// Let the main lifecycle reach finally after any in-flight Compose operation.
// Running teardown concurrently with startup can otherwise leave late containers.
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        interrupted = true;
        playwright?.kill('SIGTERM');
        api?.kill('SIGTERM');
    });
}

const waitFor = async (url, child) => {
    for (let attempt = 0; attempt < 120; attempt++) {
        assertRunning();
        if (child === api && apiStartupError) throw apiStartupError;
        if (child && (child.exitCode !== null || child.signalCode !== null)) {
            throw new Error('lca-api exited before becoming ready');
        }
        try {
            if ((await fetch(url, { signal: AbortSignal.timeout(1_000) })).ok) return;
        } catch {
            /* The service is still starting. */
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Service did not become ready: ${url}`);
};

try {
    await acquireLock();
    assertRunning();
    await compose('down', '--volumes', '--remove-orphans');
    // A fixed, lock-protected directory also bounds leftovers after a hard crash.
    temp = join(tmpdir(), `${project}-runtime`);
    await rm(temp, { recursive: true, force: true });
    await mkdir(temp, { mode: 0o700 });
    const apiPort = await freePort();
    const keycloakPort = await freePort();
    const apiUrl = `http://localhost:${apiPort}`;
    const keycloakUrl = `http://localhost:${keycloakPort}`;
    const issuer = `${keycloakUrl}/realms/learncard-oidc-e2e`;
    const adminPassword = randomBytes(24).toString('hex');
    callback = createServer((request, response) => {
        response.writeHead(request.url?.startsWith('/callback?') ? 200 : 404, {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store',
        });
        response.end('<!doctype html><title>OIDC test callback</title>Callback received');
    });
    callback.listen(0, '127.0.0.1');
    await once(callback, 'listening');
    const callbackUrl = `http://127.0.0.1:${callback.address().port}/callback`;

    const realm = JSON.parse(
        await readFile(join(repo, 'infra/keycloak/realms/learncard-dev-realm.json'), 'utf8')
    );
    realm.realm = 'learncard-oidc-e2e';
    realm.users = [];
    const appClient = realm.clients.find(client => client.clientId === 'learncard-app');
    appClient.redirectUris = [callbackUrl];
    const provider = realm.identityProviders.find(provider => provider.alias === 'lca-api');
    Object.assign(provider.config, {
        issuer: apiUrl,
        authorizationUrl: `${apiUrl}/oidc/authorize`,
        tokenUrl: `http://host.docker.internal:${apiPort}/oidc/token`,
        jwksUrl: `http://host.docker.internal:${apiPort}/oidc/jwks`,
        userInfoUrl: `http://host.docker.internal:${apiPort}/oidc/userinfo`,
    });
    const realmFile = join(temp, 'learncard-oidc-e2e-realm.json');
    await writeFile(realmFile, JSON.stringify(realm));
    composeEnv = {
        ...process.env,
        OIDC_E2E_REALM_FILE: realmFile,
        OIDC_E2E_KEYCLOAK_PORT: String(keycloakPort),
        OIDC_E2E_ADMIN_PASSWORD: adminPassword,
    };
    console.log('Starting disposable Keycloak, Redis, and MongoDB...');
    assertRunning();
    await compose('up', '-d');
    assertRunning();
    const port = async (name, internal) =>
        Number((await compose('port', name, String(internal))).stdout.trim().split(':').at(-1));
    const mongoPort = await port('mongo', 27017);
    const redisPort = await port('redis', 6379);
    const runtime = {
        apiUrl,
        keycloakUrl,
        issuer,
        callbackUrl,
        adminPassword,
        mongoUri: `mongodb://127.0.0.1:${mongoPort}`,
        mongoDbName: 'oidc-e2e',
        redisPort,
    };
    const runtimePath = join(temp, 'runtime.json');
    await writeFile(runtimePath, JSON.stringify(runtime), { mode: 0o600 });
    // Start the actual production HTTP entrypoint with local-only configuration.
    // Empty cwd + explicit dotenv path prevents loading developers' .env secrets.
    const emptyEnv = join(temp, 'empty.env');
    await writeFile(emptyEnv, '');
    assertRunning();
    api = spawn(
        'bun',
        [
            '--conditions=development',
            '--tsconfig-override',
            join(service, 'tsconfig.json'),
            join(service, 'src/docker-entry.ts'),
        ],
        {
            cwd: temp,
            env: {
                PATH: process.env.PATH,
                HOME: process.env.HOME,
                TMPDIR: process.env.TMPDIR,
                DOTENV_CONFIG_PATH: emptyEnv,
                NODE_ENV: 'development',
                CI: 'true',
                IS_OFFLINE: 'true',
                IS_E2E_TEST: 'true',
                SEED: 'a'.repeat(64),
                PORT: String(apiPort),
                MONGO_URI: runtime.mongoUri,
                MONGO_DB_NAME: runtime.mongoDbName,
                REDIS_HOST: '127.0.0.1',
                REDIS_PORT: String(redisPort),
                OIDC_ISSUER: apiUrl,
                OIDC_CLIENT_ID: 'keycloak-broker',
                OIDC_CLIENT_SECRET: provider.config.clientSecret,
                KEYCLOAK_ISSUERS: issuer,
                KEYCLOAK_AUDIENCES: 'learncard-app',
            },
            stdio: ['ignore', 'inherit', 'inherit'],
        }
    );
    api.once('error', error => {
        apiStartupError = error;
    });
    await waitFor(`${apiUrl}/.well-known/openid-configuration`, api);
    await waitFor(`${issuer}/.well-known/openid-configuration`);
    console.log('Running browser sign-in against the isolated stack...');
    assertRunning();
    playwright = spawn(
        process.execPath,
        [
            require.resolve('@playwright/test/cli'),
            'test',
            '--config',
            join(here, 'playwright.config.ts'),
            ...testArgs,
        ],
        {
            cwd: service,
            env: {
                ...process.env,
                OIDC_E2E_RUNTIME: runtimePath,
                OIDC_E2E_OUTPUT: join(temp, 'results'),
            },
            stdio: 'inherit',
        }
    );
    const [code] = await once(playwright, 'exit');
    process.exitCode = interrupted ? 130 : (code ?? 1);
    if (process.exitCode && !interrupted)
        console.error((await compose('logs', '--no-color', '--tail', '40', 'keycloak')).stdout);
} catch (error) {
    if (!interrupted) console.error(error);
    process.exitCode = interrupted ? 130 : 1;
} finally {
    try {
        await cleanup();
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
