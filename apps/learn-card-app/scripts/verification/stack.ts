import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, openSync, readFileSync } from 'node:fs';
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = resolve(APP, '../..');
const LABEL = 'org.learncard.verification';
const PORTS = [3000, 4000, 4100, 5100, 7687, 27017];
const SERVICES = [
    'brain',
    'cloud',
    'api',
    'neo4j',
    'mongodb',
    'redis',
    'redis2',
    'redis3',
    'elasticmq',
];
const LOCK = join(tmpdir(), `learncard-verification-${process.getuid?.() ?? 'user'}.lock`);

interface ProcessIdentity {
    pid: number;
    startTime: string;
    bootId: string;
}
interface StackState {
    version: 1;
    token: string;
    project: string;
    directory: string;
    repo: string;
    phase: 'starting' | 'ready' | 'failed' | 'stopped';
    createdAt: string;
    starter?: ProcessIdentity;
    frontend?: ProcessIdentity;
    imageId?: string;
    gateway?: string;
    resourcesStarted?: boolean;
    error?: string;
}
type Environment = Record<string, string>;
interface ComposeService {
    image?: string;
    command?: unknown;
    environment?: Record<string, unknown> | string[];
    healthcheck?: unknown;
    [key: string]: unknown;
}
interface Container {
    Id: string;
    Name: string;
    Config: { Labels: Record<string, string>; Image: string };
    Image: string;
    State: { Running: boolean; Health?: { Status: string } };
    NetworkSettings: { Ports: Record<string, { HostIp: string; HostPort: string }[] | null> };
}

const cleanEnvironment = (): NodeJS.ProcessEnv =>
    ({
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        USER: process.env.USER,
        TMPDIR: process.env.TMPDIR,
        DOCKER_HOST: process.env.DOCKER_HOST,
        DOCKER_CONTEXT: process.env.DOCKER_CONTEXT,
        DOCKER_CONFIG: process.env.DOCKER_CONFIG,
        DOCKER_TLS_VERIFY: process.env.DOCKER_TLS_VERIFY,
        DOCKER_CERT_PATH: process.env.DOCKER_CERT_PATH,
        SKIP_DIDKIT_NAPI: '1',
    }) as unknown as NodeJS.ProcessEnv;

const command = async (args: string[], directory: string, log?: string): Promise<string> => {
    const fd = log ? openSync(log, 'a', 0o600) : undefined;
    try {
        return await new Promise<string>((accept, reject) => {
            const child = spawn(args[0]!, args.slice(1), {
                cwd: directory,
                env: cleanEnvironment(),
                stdio: ['ignore', fd ?? 'pipe', fd ?? 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', chunk => {
                stdout += String(chunk);
            });
            child.stderr?.on('data', chunk => {
                stderr += String(chunk);
            });
            child.once('error', reject);
            child.once('exit', code =>
                code === 0
                    ? accept(stdout.trim())
                    : reject(
                          new Error(
                              `${args.join(' ')} exited ${code}: ${stderr || (log ? `see ${log}` : stdout)}`
                          )
                      )
            );
        });
    } finally {
        if (fd !== undefined) closeSync(fd);
    }
};

const save = async (state: StackState): Promise<void> => {
    const filename = join(state.directory, 'state.json');
    await writeFile(`${filename}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 });
    await rename(`${filename}.tmp`, filename);
};

const load = async (directory: string): Promise<StackState> => {
    const canonical = await realpath(directory);
    const state = JSON.parse(await readFile(join(canonical, 'state.json'), 'utf8')) as StackState;
    if (
        state.version !== 1 ||
        !/^[a-f0-9]{32}$/.test(state.token) ||
        state.project !== `lcverify-${state.token}` ||
        state.directory !== canonical ||
        state.repo !== REPO
    ) {
        throw new Error('Refusing unrecognized verification state; no resources were adopted.');
    }
    if (!state.frontend) {
        try {
            const frontend = JSON.parse(
                await readFile(join(canonical, 'frontend-process.json'), 'utf8')
            );
            if (frontend.token === state.token) state.frontend = frontend.identity;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
    }
    return state;
};

const identity = (pid: number): ProcessIdentity | undefined => {
    try {
        const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
        const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
        if (fields[0] === 'Z') return undefined;
        return {
            pid,
            startTime: fields[19]!,
            bootId: readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim(),
        };
    } catch {
        return undefined;
    }
};

const ownsProcess = (state: StackState): boolean => {
    const saved = state.frontend;
    if (!saved) return false;
    const current = identity(saved.pid);
    if (!current || current.startTime !== saved.startTime || current.bootId !== saved.bootId)
        return false;
    try {
        const args = readFileSync(`/proc/${saved.pid}/cmdline`, 'utf8').split('\0');
        return (
            args.includes(join(APP, 'scripts/verification/server.ts')) &&
            args.includes(state.directory) &&
            args.includes(state.token)
        );
    } catch {
        return false;
    }
};

const lockOwned = async (state: StackState): Promise<boolean> => {
    try {
        const lock = JSON.parse(await readFile(join(LOCK, 'owner.json'), 'utf8'));
        return lock.token === state.token && lock.directory === state.directory;
    } catch {
        return false;
    }
};

const portsFree = async (): Promise<void> => {
    // Binding the wildcard addresses also catches listeners bound only to another interface.
    for (const port of PORTS) {
        for (const host of ['0.0.0.0', '::']) {
            await new Promise<void>((accept, reject) => {
                const server = createServer();
                server.once('error', (error: NodeJS.ErrnoException) => {
                    if (host === '::' && error.code === 'EAFNOSUPPORT') accept();
                    else
                        reject(
                            new Error(`Verification requires unused port ${port}: ${error.message}`)
                        );
                });
                server.listen({ port, host, ipv6Only: host === '::' }, () =>
                    server.close(error => (error ? reject(error) : accept()))
                );
            });
        }
    }
};

// Compose defaults are deliberately resolved without consulting process.env.

const composeConfiguration = async (state: StackState): Promise<Record<string, unknown>> => {
    // Parse the checked-in template without Compose interpolation or optional user .env files.
    const source = Bun.YAML.parse(await readFile(join(APP, 'compose-local.yaml'), 'utf8')) as {
        services: Record<string, ComposeService>;
    };
    const services: Record<string, ComposeService> = {};
    const volumes: Record<string, unknown> = {};
    const labels = { [LABEL]: state.token };
    for (const name of SERVICES) {
        const original = source.services[name];
        if (!original) throw new Error(`compose-local.yaml is missing required service ${name}`);
        const environment: Environment = {};
        if (!Array.isArray(original.environment)) {
            for (const [key, value] of Object.entries(original.environment ?? {})) {
                environment[key] = String(value).replace(
                    /\$\{[^}:]+(?::-([^}]*))?\}/g,
                    (_match, fallback: string | undefined) => fallback ?? ''
                );
            }
        }
        // Copy an allowlist of service fields only: no user mounts, env_file, fixed names,
        // restart policy, remote endpoints from shell interpolation, or destructive helper.
        services[name] = {
            image: original.image,
            environment,
            labels,
            networks: ['verification'],
        };
        if (['brain', 'cloud', 'api'].includes(name)) {
            const folder =
                name === 'brain'
                    ? 'brain-service'
                    : name === 'cloud'
                      ? 'learn-cloud-service'
                      : 'lca-api';
            services[name]!.image = `learncard-verification:${state.token}`;
            services[name]!.working_dir = `/app/services/learn-card-network/${folder}`;
            services[name]!.command = ['bun', 'run', 'start:docker'];
            services[name]!.extra_hosts = ['localhost:host-gateway'];
            Object.assign(environment, {
                NODE_ENV: 'development',
                CONFIG_STAGE: '',
                LAMBDA_STAGE: '',
                IS_OFFLINE: 'true',
                SKIP_DIDKIT_NAPI: '1',
                SENTRY_DSN: '',
                SENTRY_ENV: 'verification',
                LEARN_CLOUD_URL: 'http://localhost:4100/trpc',
                NETWORK_BRAIN_SERVICE_URL: 'http://localhost:4000/trpc',
                AWS_ACCESS_KEY_ID: 'notARealKey',
                AWS_SECRET_ACCESS_KEY: 'notARealSecretKey',
                AWS_EC2_METADATA_DISABLED: 'true',
            });
            delete environment.SMART_RESUME_ACCESS_KEY;
            delete environment.SMART_RESUME_CLIENT_ID;
            delete environment.SMART_RESUME_CONTRACT_URI;
            delete environment.SKILL_EMBEDDING_GOOGLE_API_KEY;
            if (name === 'api')
                Object.assign(environment, {
                    DOMAIN_NAME: 'localhost%3A5100',
                    SA_SEED_ENCRYPT_WRITES: 'false',
                    SA_SEED_ALLOW_LEGACY_READ: 'true',
                    KEYCLOAK_ISSUERS: '',
                    KEYCLOAK_AUDIENCES: '',
                    KEYCLOAK_JWKS_URL_OVERRIDES: '',
                });
            if (name === 'cloud') environment.DOMAIN_NAME = 'localhost%3A4100';
            const port = name === 'brain' ? 4000 : name === 'cloud' ? 4100 : 5100;
            // The bridge-only binding permits container did:web resolution through
            // host-gateway without exposing services on the workstation's LAN.
            services[name]!.ports = [
                `127.0.0.1:${port}:${port}`,
                `${state.gateway}:${port}:${port}`,
            ];
            services[name]!.depends_on =
                name === 'brain'
                    ? {
                          neo4j: { condition: 'service_healthy' },
                          redis: { condition: 'service_healthy' },
                          elasticmq: { condition: 'service_started' },
                      }
                    : {
                          mongodb: { condition: 'service_healthy' },
                          [name === 'cloud' ? 'redis2' : 'redis3']: {
                              condition: 'service_healthy',
                          },
                      };
        } else if (name === 'neo4j') {
            services[name]!.ports = ['127.0.0.1:7687:7687'];
            services[name]!.healthcheck = {
                test: [
                    'CMD-SHELL',
                    'cypher-shell -u neo4j -p this-is-the-password "RETURN 1" >/dev/null',
                ],
                interval: '5s',
                timeout: '15s',
                retries: 60,
                start_period: '30s',
            };
        } else if (name === 'mongodb') {
            services[name]!.command = original.command;
            services[name]!.extra_hosts = ['localhost:host-gateway'];
            services[name]!.ports = ['127.0.0.1:27017:27017', `${state.gateway}:27017:27017`];
            services[name]!.healthcheck = {
                test: [
                    'CMD-SHELL',
                    `mongosh --host 127.0.0.1 --quiet --eval "try { rs.status() } catch (e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]}) }; quit(db.hello().isWritablePrimary ? 0 : 1)"`,
                ],
                interval: '3s',
                timeout: '15s',
                retries: 60,
            };
        } else if (name.startsWith('redis')) {
            services[name]!.healthcheck = {
                test: ['CMD', 'redis-cli', 'ping'],
                interval: '3s',
                timeout: '5s',
                retries: 30,
            };
        }
        if (name === 'neo4j' || name === 'mongodb' || name.startsWith('redis')) {
            volumes[name] = { labels };
            services[name]!.volumes = [`${name}:${name === 'mongodb' ? '/data/db' : '/data'}`];
        }
    }
    return { services, volumes, networks: { verification: { labels } } };
};

const containersFor = async (state: StackState): Promise<Container[]> => {
    const ids = await command(
        ['docker', 'ps', '-aq', '--filter', `label=${LABEL}=${state.token}`],
        state.directory
    );
    if (!ids) return [];
    const containers = JSON.parse(
        await command(['docker', 'inspect', ...ids.split(/\s+/)], state.directory)
    ) as Container[];
    for (const container of containers) {
        if (
            container.Config.Labels[LABEL] !== state.token ||
            container.Config.Labels['com.docker.compose.project'] !== state.project
        ) {
            throw new Error('Container ownership mismatch; refusing to manage it.');
        }
    }
    return containers;
};

const jsonGet = async (url: string): Promise<unknown> => {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'error' });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
};

/** Read-only readiness: process birth identity, resource labels/ports, DB health and real DID documents. */
export const doctorStack = async (directory: string): Promise<Record<string, unknown>> => {
    const state = await load(directory);
    const owned = await lockOwned(state);
    const containers = state.resourcesStarted ? await containersFor(state) : [];
    const frontend = ownsProcess(state);
    const services: Record<string, unknown> = {};
    let ready = owned && frontend && containers.length === SERVICES.length;
    for (const name of SERVICES) {
        const container = containers.find(
            item => item.Config.Labels['com.docker.compose.service'] === name
        );
        const expectedPort = (
            { brain: 4000, cloud: 4100, api: 5100, neo4j: 7687, mongodb: 27017 } as Record<
                string,
                number
            >
        )[name];
        const bindings = expectedPort
            ? container?.NetworkSettings.Ports[`${expectedPort}/tcp`]
            : undefined;
        const portOwned =
            !expectedPort ||
            bindings?.some(
                binding =>
                    binding.HostIp === '127.0.0.1' && binding.HostPort === String(expectedPort)
            );
        const healthy =
            container?.State.Running &&
            (!container.State.Health || container.State.Health.Status === 'healthy');
        const imageOwned =
            !['brain', 'cloud', 'api'].includes(name) || container?.Image === state.imageId;
        ready &&= Boolean(healthy && portOwned && imageOwned);
        services[name] = {
            id: container?.Id,
            running: container?.State.Running ?? false,
            health: container?.State.Health?.Status,
            portOwned: Boolean(portOwned),
            imageOwned,
        };
    }
    for (const [name, port] of [
        ['brain', 4000],
        ['cloud', 4100],
        ['api', 5100],
    ] as const) {
        const url = `http://localhost:${port}/.well-known/did.json`;
        if (
            !owned ||
            !containers.some(
                item =>
                    item.Config.Labels['com.docker.compose.service'] === name && item.State.Running
            )
        ) {
            services[`${name}Did`] = { url, ok: false, error: 'Owned service is not running' };
            ready = false;
            continue;
        }
        try {
            const did = (await jsonGet(url)) as { id?: string; verificationMethod?: unknown[] };
            const valid =
                did.id === `did:web:localhost%3A${port}` && Boolean(did.verificationMethod?.length);
            services[`${name}Did`] = { url, id: did.id, ok: valid };
            ready &&= valid;
        } catch (error) {
            services[`${name}Did`] = { url, ok: false, error: String(error) };
            ready = false;
        }
    }
    const brain = containers.find(
        item => item.Config.Labels['com.docker.compose.service'] === 'brain' && item.State.Running
    );
    if (owned && brain) {
        try {
            const probe = `for (const port of [4000,4100,5100]) { const response = await fetch('http://localhost:'+port+'/.well-known/did.json', {signal:AbortSignal.timeout(5000)}); const doc = await response.json(); if (!response.ok || doc.id !== 'did:web:localhost%3A'+port || !doc.verificationMethod?.length) throw new Error('DID resolution failed on '+port); } const queues = await fetch('http://elasticmq:9324/?Action=ListQueues&Version=2012-11-05', {signal:AbortSignal.timeout(5000)}); if (!queues.ok || !(await queues.text()).includes('notifications')) throw new Error('Notification queue is not ready'); console.log('ready');`;
            await command(['docker', 'exec', brain.Id, 'bun', '-e', probe], state.directory);
            services.crossServiceResolution = { ok: true };
        } catch (error) {
            services.crossServiceResolution = { ok: false, error: String(error) };
            ready = false;
        }
    } else ready = false;
    try {
        if (!owned || !frontend) throw new Error('Owned frontend process is not running');
        const result = (await jsonGet('http://localhost:3000/__verification')) as {
            token?: string;
        };
        const valid = result.token === state.token;
        services.frontend = { url: 'http://localhost:3000', identity: valid };
        ready &&= valid;
    } catch (error) {
        services.frontend = { ok: false, error: String(error) };
        ready = false;
    }
    return {
        ok: ready,
        phase: state.phase,
        owned,
        frontend,
        project: state.project,
        directory: state.directory,
        containers: containers.map(item => item.Id),
        services,
    };
};

/** Start a fresh, uniquely owned database and current-checkout source stack. */
export const startStack = async (directory: string): Promise<void> => {
    if (process.platform !== 'linux')
        throw new Error('lc verify currently requires Linux /proc process identity tracking.');
    const canonical = await realpath(directory);
    // A directory is an evidence record for exactly one stack, never silently reset it.
    try {
        await readFile(join(canonical, 'state.json'));
        throw new Error(
            'This directory already has verification state. Use doctor/down or a fresh --dir.'
        );
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    await mkdir(LOCK, { mode: 0o700 }).catch(error => {
        throw new Error(
            `Another verification owns ${LOCK}; use its recorded directory with lc verify down.`,
            { cause: error }
        );
    });
    const token = randomUUID().replaceAll('-', '');
    const state: StackState = {
        version: 1,
        token,
        project: `lcverify-${token}`,
        directory: canonical,
        repo: REPO,
        phase: 'starting',
        createdAt: new Date().toISOString(),
        starter: identity(process.pid),
    };
    try {
        await writeFile(join(LOCK, 'owner.json'), JSON.stringify({ token, directory: canonical }), {
            mode: 0o600,
        });
        await save(state);
        await portsFree();
        const context = await command(['docker', 'context', 'show'], canonical);
        const details = JSON.parse(
            await command(['docker', 'context', 'inspect', context], canonical)
        );
        const endpoint = process.env.DOCKER_HOST ?? details[0]?.Endpoints?.docker?.Host;
        if (typeof endpoint !== 'string' || !endpoint.startsWith('unix://'))
            throw new Error(
                'Verification requires a local Docker Unix-socket daemon, never a remote Docker host.'
            );
        await command(['docker', 'info'], canonical);
        const bridge = JSON.parse(
            await command(['docker', 'network', 'inspect', 'bridge'], canonical)
        );
        state.gateway = bridge[0]?.IPAM?.Config?.find((entry: { Gateway?: string }) =>
            /^\d+\.\d+\.\d+\.\d+$/.test(entry.Gateway ?? '')
        )?.Gateway;
        if (!state.gateway)
            throw new Error(
                'Docker must provide its default IPv4 bridge for localhost host-gateway routing.'
            );
        await command(['docker', 'compose', 'version'], canonical);
        const config = await composeConfiguration(state);
        const composePath = join(canonical, 'compose.json');
        await writeFile(composePath, JSON.stringify(config, null, 2), { mode: 0o600 });
        state.resourcesStarted = true;
        await save(state);
        await command(
            [
                'docker',
                'build',
                '--file',
                'Dockerfile.monorepo',
                '--target',
                'backend',
                '--label',
                `${LABEL}=${token}`,
                '--tag',
                `learncard-verification:${token}`,
                '.',
            ],
            REPO,
            join(canonical, 'build.log')
        );
        state.imageId = await command(
            [
                'docker',
                'image',
                'inspect',
                '--format',
                '{{.Id}}',
                `learncard-verification:${token}`,
            ],
            canonical
        );
        await save(state);
        await command(
            [
                'docker',
                'compose',
                '--project-name',
                state.project,
                '--file',
                composePath,
                'up',
                '--detach',
                '--no-build',
            ],
            canonical,
            join(canonical, 'compose.log')
        );
        const log = openSync(join(canonical, 'frontend.log'), 'a', 0o600);
        try {
            const child = spawn(
                process.execPath,
                [
                    '--conditions=development',
                    join(APP, 'scripts/verification/server.ts'),
                    canonical,
                    token,
                ],
                {
                    cwd: APP,
                    detached: true,
                    stdio: ['ignore', log, log],
                    env: {
                        ...cleanEnvironment(),
                        LC_VERIFY_DIRECTORY: canonical,
                        VITE_AI_AGENT_URL: 'http://localhost:4300',
                    },
                }
            );
            await new Promise<void>((accept, reject) => {
                child.once('spawn', accept);
                child.once('error', reject);
            });
            state.frontend = identity(child.pid!);
            child.unref();
            if (!state.frontend)
                throw new Error('Frontend exited before process identity could be recorded.');
            await save(state);
        } finally {
            closeSync(log);
        }
        const deadline = Date.now() + 240_000;
        while (Date.now() < deadline) {
            const report = await doctorStack(canonical);
            if (report.ok) {
                state.phase = 'ready';
                await save(state);
                return;
            }
            if (!ownsProcess(state)) throw new Error('Frontend exited; see frontend.log.');
            await Bun.sleep(2000);
        }
        throw new Error('Service readiness timed out; run doctor and inspect retained logs.');
    } catch (error) {
        state.phase = 'failed';
        state.error = String(error);
        await save(state);
        try {
            await stopStack(canonical);
        } catch (cleanup) {
            throw new AggregateError(
                [error, cleanup],
                `${String(error)}; cleanup failed: ${String(cleanup)}. Use lc verify down --dir ${canonical}`,
                { cause: cleanup }
            );
        }
        throw error;
    }
};

/** Remove only token-labelled resources; retain all state, logs and browser evidence. */
export const stopStack = async (directory: string): Promise<void> => {
    let state: StackState;
    try {
        state = await load(directory);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw error;
    }
    if (state.phase === 'stopped') {
        if (await lockOwned(state)) await rm(LOCK, { recursive: true });
        return;
    }
    if (state.phase === 'starting' && state.starter && state.starter.pid !== process.pid) {
        const current = identity(state.starter.pid);
        if (
            current?.startTime === state.starter.startTime &&
            current.bootId === state.starter.bootId
        ) {
            throw new Error(
                'Startup is still running. Interrupt that lc verify up process and let its finally block clean up.'
            );
        }
    }
    if (!(await lockOwned(state)))
        throw new Error('Verification lock ownership mismatch; refusing cleanup.');
    if (ownsProcess(state)) {
        process.kill(state.frontend!.pid, 'SIGTERM');
        const deadline = Date.now() + 10_000;
        while (ownsProcess(state) && Date.now() < deadline) await Bun.sleep(100);
        if (ownsProcess(state)) process.kill(state.frontend!.pid, 'SIGKILL');
    }
    const containers = state.resourcesStarted ? await containersFor(state) : [];
    for (const container of containers) {
        const service = container.Config.Labels['com.docker.compose.service'];
        const name = service && SERVICES.includes(service) ? service : container.Id;
        await command(
            ['docker', 'logs', '--timestamps', container.Id],
            state.directory,
            join(state.directory, `${name}.log`)
        ).catch(() => undefined);
        await command(['docker', 'rm', '--force', '--volumes', container.Id], state.directory);
    }
    for (const kind of state.resourcesStarted ? (['volume', 'network'] as const) : []) {
        const ids = await command(
            ['docker', kind, 'ls', '-q', '--filter', `label=${LABEL}=${state.token}`],
            state.directory
        );
        for (const id of ids.split(/\s+/).filter(Boolean)) {
            const resources = JSON.parse(
                await command(['docker', kind, 'inspect', id], state.directory)
            ) as { Labels?: Record<string, string> }[];
            if (
                resources[0]?.Labels?.[LABEL] !== state.token ||
                resources[0]?.Labels?.['com.docker.compose.project'] !== state.project
            )
                throw new Error(`${kind} ownership mismatch`);
            await command(['docker', kind, 'rm', id], state.directory);
        }
    }
    if (state.resourcesStarted) {
        const images = await command(
            [
                'docker',
                'image',
                'ls',
                '--quiet',
                '--no-trunc',
                `learncard-verification:${state.token}`,
            ],
            state.directory
        );
        if (images) {
            const [image] = JSON.parse(
                await command(
                    ['docker', 'image', 'inspect', `learncard-verification:${state.token}`],
                    state.directory
                )
            );
            if (
                image?.Config?.Labels?.[LABEL] !== state.token ||
                (state.imageId && images !== state.imageId)
            ) {
                throw new Error('Verification image identity changed; refusing to remove it.');
            }
            await command(
                ['docker', 'image', 'rm', `learncard-verification:${state.token}`],
                state.directory
            );
        }
    }
    state.phase = 'stopped';
    await save(state);
    if (await lockOwned(state)) await rm(LOCK, { recursive: true });
};

/** The running container for one owned Compose service, after full ownership validation. */
export const ownedContainer = async (
    directory: string,
    service: string
): Promise<{ id: string; directory: string }> => {
    const state = await load(directory);
    if (!(await lockOwned(state))) throw new Error('Verification lock ownership mismatch.');
    const container = (state.resourcesStarted ? await containersFor(state) : []).find(
        item => item.Config.Labels['com.docker.compose.service'] === service && item.State.Running
    );
    if (!container) throw new Error(`Owned service ${service} is not running in ${directory}`);
    return { id: container.Id, directory: state.directory };
};

/** Run a command against an owned container (used only by read-only inspection helpers). */
export const execInOwned = async (
    directory: string,
    service: string,
    args: string[]
): Promise<string> => {
    const { id, directory: canonical } = await ownedContainer(directory, service);
    return command(['docker', 'exec', id, ...args], canonical);
};

export const ownedServices = SERVICES;
