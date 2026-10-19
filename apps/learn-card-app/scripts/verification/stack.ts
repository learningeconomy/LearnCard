import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { closeSync, openSync } from 'node:fs';
import { lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:net';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { z } from 'zod';
import { APP_ROOT as APP, REPO_ROOT as REPO, stackEndpoints } from './constants';
import type { StackEndpoints, VerificationPorts } from './types';
import { prepareVerification } from './prepare';
import { createTimings } from './timings';
import { dockerBuildArguments } from './docker-build';
import { preflightVerification, verifyDockerTrust } from './preflight';
import {
    cleanEnvironment,
    matchesProcess,
    processIdentity as identity,
    ProcessIdentitySchema,
    runCommand,
    terminateProcess,
    waitForChildIdentity,
    withDirectoryLock,
    type ProcessIdentity,
} from './process';

const LABEL = 'org.learncard.verification';
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
const PORT_KEYS = ['app', 'brain', 'cloud', 'api', 'neo4j', 'mongo', 'partner'] as const;
const PORT_CLAIMS = join('/tmp', `learncard-verification-${process.getuid?.() ?? 'user'}-ports`);
interface StackState {
    version: 2;
    token: string;
    project: string;
    directory: string;
    repo: string;
    ports: VerificationPorts;
    phase: 'starting' | 'ready' | 'failed' | 'stopped';
    createdAt: string;
    starter: ProcessIdentity;
    frontend?: ProcessIdentity;
    imageId?: string;
    gateway?: string;
    resourcesStarted?: boolean;
    error?: string;
}
const PortSchema = z.number().int().min(1024).max(65535);
const StateSchema = z.object({
    version: z.literal(2),
    token: z.string().regex(/^[a-f0-9]{32}$/),
    project: z.string(),
    directory: z.string(),
    repo: z.string(),
    ports: z
        .object({
            app: PortSchema,
            brain: PortSchema,
            cloud: PortSchema,
            api: PortSchema,
            neo4j: PortSchema,
            mongo: PortSchema,
            partner: PortSchema,
        })
        .strict(),
    phase: z.enum(['starting', 'ready', 'failed', 'stopped']),
    createdAt: z.string(),
    starter: ProcessIdentitySchema,
    frontend: ProcessIdentitySchema.optional(),
    imageId: z.string().optional(),
    gateway: z.string().optional(),
    resourcesStarted: z.boolean().optional(),
    error: z.string().optional(),
});
const ProcessRecordSchema = z.object({ token: z.string(), identity: ProcessIdentitySchema });
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
    Config: { Labels: Record<string, string>; Image: string };
    Image: string;
    State: {
        Running: boolean;
        Health?: { Status: string };
        Status?: string;
        ExitCode?: number;
        Error?: string;
    };
    NetworkSettings: { Ports: Record<string, { HostIp: string; HostPort: string }[] | null> };
}

const privatePath = async (path: string, directory = false): Promise<void> => {
    const info = await lstat(path);
    if (
        info.isSymbolicLink() ||
        info.uid !== process.getuid?.() ||
        info.mode & 0o022 ||
        (directory ? !info.isDirectory() : !info.isFile())
    ) {
        throw new Error(
            `Refusing unowned, writable-by-others, or symlinked verification path ${path}`
        );
    }
};

const save = async (state: StackState): Promise<void> => {
    const filename = join(state.directory, 'state.json');
    const temporary = `${filename}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600, flag: 'wx' });
    await rename(temporary, filename);
};

const lockOwned = async (state: StackState): Promise<boolean> => {
    try {
        const path = join(state.directory, 'owner.json');
        await privatePath(path);
        const owner = JSON.parse(await readFile(path, 'utf8'));
        return owner.token === state.token && owner.directory === state.directory;
    } catch {
        return false;
    }
};

const load = async (directory: string): Promise<StackState> => {
    const canonical = await realpath(directory);
    await privatePath(canonical, true);
    await privatePath(join(canonical, 'state.json'));
    const state: StackState = StateSchema.parse(
        JSON.parse(await readFile(join(canonical, 'state.json'), 'utf8'))
    );
    const ports = PORT_KEYS.map(key => state.ports?.[key]);
    if (
        state.version !== 2 ||
        !/^[a-f0-9]{32}$/.test(state.token) ||
        state.project !== `lcverify-${state.token}` ||
        state.directory !== canonical ||
        state.repo !== REPO ||
        ports.some(port => !Number.isSafeInteger(port) || port < 1024 || port > 65535) ||
        new Set(ports).size !== PORT_KEYS.length ||
        !(await lockOwned(state))
    ) {
        throw new Error(
            'Refusing unrecognized verification state/port allocation; no resources were adopted.'
        );
    }
    // The child also records itself, closing the parent's post-spawn crash window.
    if (!state.frontend) {
        try {
            const path = join(canonical, 'frontend-process.json');
            await privatePath(path);
            const saved = ProcessRecordSchema.parse(JSON.parse(await readFile(path, 'utf8')));
            if (saved.token !== state.token)
                throw new Error('Frontend process ownership mismatch.');
            state.frontend = saved.identity;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        }
    }
    return state;
};

export const readStackEndpoints = async (directory: string): Promise<StackEndpoints> => {
    const state = await load(directory);
    if (state.phase !== 'stopped') {
        await privatePath(PORT_CLAIMS, true);
        for (const port of Object.values(state.ports)) {
            const path = join(PORT_CLAIMS, `${port}.json`);
            await privatePath(path);
            const claim = JSON.parse(await readFile(path, 'utf8'));
            if (
                claim.token !== state.token ||
                claim.directory !== state.directory ||
                claim.port !== port
            )
                throw new Error(
                    `Persisted allocation for port ${port} is not owned by this stack.`
                );
        }
    }
    return stackEndpoints(state.ports);
};

const ownsProcess = (state: StackState): boolean => matchesProcess(state.frontend);

export const registerAuxiliaryProcess = async (directory: string, pid: number): Promise<void> => {
    const state = await load(directory);
    if (!['starting', 'ready'].includes(state.phase))
        throw new Error('Cannot register a child in a stopped/failed stack.');
    const stopping = await lstat(join(state.directory, 'stop-request.json')).then(
        () => true,
        error => {
            if (error.code === 'ENOENT') return false;
            throw error;
        }
    );
    if (stopping) throw new Error('Stack shutdown requested; refusing a new auxiliary child.');
    const saved = await waitForChildIdentity(pid);
    // Only observed exit, not a transient pre-exec cmdline gap, skips registration.
    if (!saved) return;
    const processes = join(state.directory, 'processes');
    await mkdir(processes, { recursive: true, mode: 0o700 });
    await privatePath(processes, true);
    await writeFile(
        join(processes, `${pid}.json`),
        JSON.stringify({ token: state.token, identity: saved }),
        { mode: 0o600, flag: 'wx' }
    );
};

export const stopAuxiliaryProcess = async (directory: string, pid: number): Promise<void> => {
    const state = await load(directory);
    const path = join(state.directory, 'processes', `${pid}.json`);
    try {
        await privatePath(path);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw error;
    }
    const saved = ProcessRecordSchema.parse(JSON.parse(await readFile(path, 'utf8')));
    if (saved.token !== state.token || saved.identity?.pid !== pid)
        throw new Error('Auxiliary process ownership mismatch.');
    const current = identity(pid);
    if (
        current?.startTime === saved.identity.startTime &&
        current.bootId === saved.identity.bootId &&
        !matchesProcess(saved.identity)
    )
        throw new Error(
            `Auxiliary process ${pid} changed its command fingerprint; refusing to kill or erase its ownership evidence.`
        );
    await terminateProcess(saved.identity);
    await rm(path, { force: true });
};

const command = (
    args: string[],
    directory: string,
    log?: string,
    signal?: AbortSignal,
    timeoutMs = 30_000
): Promise<string> => runCommand(args, directory, { log, signal, timeoutMs });

interface PortAllocation {
    ports: VerificationPorts;
    release: () => Promise<void>;
}
/** Hold OS socket reservations until Docker/frontend handoff. Never adopt a raced listener. */
const allocatePorts = async (directory: string, token: string): Promise<PortAllocation> => {
    const sockets: Server[] = [];
    const claims: string[] = [];
    await mkdir(PORT_CLAIMS, { mode: 0o700, recursive: true });
    await privatePath(PORT_CLAIMS, true);
    const release = async () => {
        await Promise.all(
            sockets.map(server => new Promise<void>(resolve => server.close(() => resolve())))
        );
        sockets.length = 0;
    };
    const ports = {} as VerificationPorts;
    try {
        for (const key of PORT_KEYS) {
            let allocated = false;
            for (let attempt = 0; attempt < 100 && !allocated; attempt++) {
                const server = createServer();
                await new Promise<void>((resolve, reject) => {
                    server.once('error', reject);
                    server.listen({ host: '0.0.0.0', port: 0 }, resolve);
                });
                const address = server.address();
                if (!address || typeof address === 'string')
                    throw new Error('OS did not allocate a TCP port.');
                const claim = join(PORT_CLAIMS, `${address.port}.json`);
                try {
                    await writeFile(
                        claim,
                        JSON.stringify({ directory, token, port: address.port }),
                        { mode: 0o600, flag: 'wx' }
                    );
                } catch (error) {
                    await new Promise<void>(resolve => server.close(() => resolve()));
                    if ((error as NodeJS.ErrnoException).code === 'EEXIST') continue;
                    throw error;
                }
                sockets.push(server);
                claims.push(claim);
                ports[key] = address.port;
                const ipv6 = createServer();
                await new Promise<void>((resolve, reject) => {
                    ipv6.once('error', (error: NodeJS.ErrnoException) => {
                        if (error.code === 'EAFNOSUPPORT') resolve();
                        else reject(error);
                    });
                    ipv6.listen({ host: '::', port: ports[key], ipv6Only: true }, () => {
                        sockets.push(ipv6);
                        resolve();
                    });
                });
                allocated = true;
            }
            if (!allocated)
                throw new Error(
                    'Could not reserve an unclaimed verification port after 100 attempts; recover stale stacks with their owned down command.'
                );
        }
        return { ports, release };
    } catch (error) {
        await release();
        await Promise.all(claims.map(path => rm(path)));
        throw error;
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
    const templatePorts: Record<string, number> = {
        '3000': state.ports.app,
        '4000': state.ports.brain,
        '4100': state.ports.cloud,
        '5100': state.ports.api,
    };
    for (const name of SERVICES) {
        const original = source.services[name];
        if (!original) throw new Error(`compose-local.yaml is missing required service ${name}`);
        const environment: Environment = {};
        if (!Array.isArray(original.environment)) {
            for (const [key, value] of Object.entries(original.environment ?? {})) {
                environment[key] = String(value)
                    .replace(
                        /\$\{[^}:]+(?::-([^}]*))?\}/g,
                        (_match, fallback: string | undefined) => fallback ?? ''
                    )
                    .replace(
                        /localhost(:|%3A)(3000|4000|4100|5100)(?!\d)/g,
                        (_match, separator: string, port: string) =>
                            `localhost${separator}${templatePorts[port]}`
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
                LEARN_CLOUD_URL: `http://cloud:${state.ports.cloud}/trpc`,
                NETWORK_BRAIN_SERVICE_URL: `http://brain:${state.ports.brain}/trpc`,
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
                    DOMAIN_NAME: `localhost%3A${state.ports.api}`,
                    MONGO_URI: 'mongodb://mongodb:27017?ssl=false&replicaSet=rs0',
                    SA_SEED_ENCRYPT_WRITES: 'false',
                    SA_SEED_ALLOW_LEGACY_READ: 'true',
                    KEYCLOAK_ISSUERS: '',
                    KEYCLOAK_AUDIENCES: '',
                    KEYCLOAK_JWKS_URL_OVERRIDES: '',
                });
            environment.DOMAIN_NAME = `localhost%3A${state.ports[name as 'brain' | 'cloud' | 'api']}`;
            if (name === 'cloud') {
                environment.LEARN_CLOUD_MONGO_URI =
                    'mongodb://mongodb:27017?ssl=false&replicaSet=rs0';
                environment.SERVER_URL = `http://cloud:${state.ports.cloud}`;
            }
            const hostPort = state.ports[name as 'brain' | 'cloud' | 'api'];
            // Offline DID documents derive authority from PORT. Keep the listener and
            // published authority identical rather than accepting an incorrect DID.
            environment.PORT = String(hostPort);
            // The bridge-only binding permits container did:web resolution through
            // host-gateway without exposing services on the workstation's LAN.
            services[name]!.ports = [
                `127.0.0.1:${hostPort}:${hostPort}`,
                `${state.gateway}:${hostPort}:${hostPort}`,
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
            services[name]!.ports = [`127.0.0.1:${state.ports.neo4j}:7687`];
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
            if (
                !Array.isArray(original.command) ||
                !original.command.every(part => typeof part === 'string')
            )
                throw new Error('Expected the checked-in Mongo command argument array.');
            // Mongo logs must reach Docker stdout so startup evidence survives container removal.
            services[name]!.command = original.command.filter(
                (part, index, parts) => part !== '--logpath' && parts[index - 1] !== '--logpath'
            );
            services[name]!.ports = [`127.0.0.1:${state.ports.mongo}:27017`];
            services[name]!.healthcheck = {
                test: [
                    'CMD-SHELL',
                    `mongosh --host 127.0.0.1 --quiet --eval "try { rs.status() } catch (e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb:27017'}]}) }; quit(db.hello().isWritablePrimary ? 0 : 1)"`,
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

const containersFor = async (state: StackState, signal?: AbortSignal): Promise<Container[]> => {
    const ids = await command(
        ['docker', 'ps', '-aq', '--filter', `label=${LABEL}=${state.token}`],
        state.directory,
        undefined,
        signal
    );
    if (!ids) return [];
    const containers = JSON.parse(
        await command(
            ['docker', 'inspect', ...ids.split(/\s+/)],
            state.directory,
            undefined,
            signal
        )
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

const jsonGet = async (url: string, signal?: AbortSignal): Promise<unknown> => {
    const response = await fetch(url, {
        signal: signal
            ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
            : AbortSignal.timeout(5000),
        redirect: 'error',
    });
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
    return response.json();
};

/** Read-only probes identify the failing service and never infer readiness from an open port. */
export const doctorStack = async (
    directory: string,
    options: { signal?: AbortSignal } = {}
): Promise<Record<string, unknown>> => {
    const { signal } = options;
    const state = await load(directory);
    await verifyDockerTrust(signal);
    const containers = state.resourcesStarted ? await containersFor(state, signal) : [];
    const frontend = ownsProcess(state);
    const services: Record<string, unknown> = {};
    const failures: string[] = [];
    const internalPorts: Record<string, number> = {
        brain: state.ports.brain,
        cloud: state.ports.cloud,
        api: state.ports.api,
        neo4j: 7687,
        mongodb: 27017,
    };
    const hostPorts: Record<string, number> = { ...state.ports, mongodb: state.ports.mongo };
    for (const name of SERVICES) {
        signal?.throwIfAborted();
        const container = containers.find(
            item => item.Config.Labels['com.docker.compose.service'] === name
        );
        const port = internalPorts[name];
        const bindings = port ? container?.NetworkSettings.Ports[`${port}/tcp`] : undefined;
        const portOwned =
            !port ||
            Boolean(
                bindings?.some(
                    binding =>
                        binding.HostIp === '127.0.0.1' &&
                        binding.HostPort === String(hostPorts[name])
                )
            );
        const healthy = Boolean(
            container?.State.Running &&
            (!container.State.Health || container.State.Health.Status === 'healthy')
        );
        const imageOwned =
            !['brain', 'cloud', 'api'].includes(name) || container?.Image === state.imageId;
        const ok = healthy && portOwned && imageOwned;
        services[name] = {
            ok,
            id: container?.Id,
            state: container?.State,
            portOwned,
            imageOwned,
            log: join(state.directory, `${name}.log`),
        };
        if (!ok)
            failures.push(
                `${name}: ${!container ? 'missing' : !healthy ? JSON.stringify(container.State) : !portOwned ? 'port allocation mismatch' : 'image ownership mismatch'}`
            );
    }
    for (const name of ['brain', 'cloud', 'api'] as const) {
        signal?.throwIfAborted();
        const port = state.ports[name];
        const url = `http://localhost:${port}/.well-known/did.json`;
        const container = containers.find(
            item => item.Config.Labels['com.docker.compose.service'] === name && item.State.Running
        );
        try {
            if (!container) throw new Error('Owned service is not running');
            const doc = await jsonGet(url, signal);
            if (
                !doc ||
                typeof doc !== 'object' ||
                !('id' in doc) ||
                doc.id !== `did:web:localhost%3A${port}` ||
                !('verificationMethod' in doc) ||
                !Array.isArray(doc.verificationMethod) ||
                !doc.verificationMethod.length
            ) {
                throw new Error(
                    `Expected did:web:localhost%3A${port} with a verification method; received ${JSON.stringify(doc)}`
                );
            }
            services[`${name}Did`] = { ok: true, url };
        } catch (error) {
            services[`${name}Did`] = { ok: false, url, error: String(error) };
            failures.push(`${name}Did: ${String(error)}`);
        }
        if (!container) continue;
        try {
            // Mongo is bridge-internal; only did:web localhost authorities require host-gateway.
            const ports = JSON.stringify([state.ports.brain, state.ports.cloud, state.ports.api]);
            const probe = `for (const port of ${ports}) { const url='http://localhost:'+port+'/.well-known/did.json'; try { const r=await fetch(url,{signal:AbortSignal.timeout(4000),redirect:'error'}); const d=await r.json(); if(!r.ok||d.id!=='did:web:localhost%3A'+port||!d.verificationMethod?.length)throw Error('HTTP '+r.status+'; expected did:web:localhost%3A'+port+' with verification method, received '+JSON.stringify(d.id)); } catch(e) {throw Error(url+' via host-gateway: '+e)} }`;
            await command(
                ['docker', 'exec', container.Id, 'bun', '-e', probe],
                state.directory,
                undefined,
                signal,
                15_000
            );
            services[`${name}HostGatewayDid`] = { ok: true, gateway: state.gateway };
        } catch (error) {
            const diagnostic = `${name} container -> localhost did:web via host-gateway ${state.gateway}: ${String(error)}. For connection failures check Docker bridge-to-host reachability and host firewall policy; DID mismatches indicate service authority configuration. Verification does not change firewall/network configuration. Mongo replica traffic stays at mongodb:27017.`;
            services[`${name}HostGatewayDid`] = { ok: false, error: diagnostic };
            failures.push(diagnostic);
        }
    }
    const brain = containers.find(
        item => item.Config.Labels['com.docker.compose.service'] === 'brain' && item.State.Running
    );
    if (brain) {
        try {
            await command(
                [
                    'docker',
                    'exec',
                    brain.Id,
                    'bun',
                    '-e',
                    `const r=await fetch('http://elasticmq:9324/?Action=ListQueues&Version=2012-11-05',{signal:AbortSignal.timeout(4000)});if(!r.ok||!(await r.text()).includes('notifications'))throw Error('Notification queue missing');`,
                ],
                state.directory,
                undefined,
                signal,
                6000
            );
            services.notificationQueue = { ok: true };
        } catch (error) {
            failures.push(`notificationQueue: ${String(error)}`);
            services.notificationQueue = { ok: false, error: String(error) };
        }
    }
    let permanentFrontendFailure = false;
    try {
        if (!frontend) throw new Error('Owned frontend process is not running');
        const result = await jsonGet(`http://localhost:${state.ports.app}/__verification`, signal);
        if (
            !result ||
            typeof result !== 'object' ||
            !('token' in result) ||
            result.token !== state.token
        )
            throw new Error('Frontend ownership token mismatch');
        const root = stackEndpoints(state.ports).app;
        const response = await fetch(root, {
            signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
                : AbortSignal.timeout(5000),
            redirect: 'error',
        });
        if (!response.ok) {
            permanentFrontendFailure = response.status === 404;
            throw new Error(`Frontend root ${root}: HTTP ${response.status}`);
        }
        const html = await response.text();
        if (!html.includes('id="root"') || !html.includes('/src/index')) {
            permanentFrontendFailure = true;
            throw new Error(`Frontend root ${root} is not the prepared LearnCard HTML`);
        }
        services.frontend = { ok: true, url: stackEndpoints(state.ports).app };
    } catch (error) {
        services.frontend = {
            ok: false,
            error: String(error),
            fatal: permanentFrontendFailure,
        };
        failures.push(`frontend: ${String(error)}; see ${join(state.directory, 'frontend.log')}`);
    }
    signal?.throwIfAborted();
    return {
        ok: failures.length === 0 && containers.length === SERVICES.length,
        phase: state.phase,
        owned: true,
        frontend,
        project: state.project,
        directory: state.directory,
        endpoints: stackEndpoints(state.ports),
        containers: containers.map(item => item.Id),
        services,
        failures,
    };
};

/** Each fresh directory owns one immutable allocation and token, not a machine-wide lock. */
export const startStack = async (
    directory: string,
    options: {
        signal?: AbortSignal;
        builder?: string;
        onProgress?: (event: Record<string, unknown>) => void;
    } = {}
): Promise<void> => {
    const { signal, onProgress } = options;
    const canonical = await realpath(directory);
    await privatePath(canonical, true);
    const progress = (stage: string, extra: Record<string, unknown> = {}) =>
        onProgress?.({ event: 'progress', stage, directory: canonical, ...extra });
    const measure = createTimings(join(canonical, 'startup-timings.json'));
    progress('preflight');
    const preflight = await measure('preflight', () =>
        preflightVerification(canonical, { signal })
    );
    progress('preflight-complete', { preflight });
    const existingState = await lstat(join(canonical, 'state.json')).then(
        () => true,
        error => {
            if (error.code === 'ENOENT') return false;
            throw error;
        }
    );
    if (existingState)
        throw new Error(
            'This directory already has verification state. Use doctor/down or a fresh --dir; existing evidence is never overwritten.'
        );
    // Exclusive creation arbitrates same-directory starts; retained ownership prevents reuse.
    const token = randomUUID().replaceAll('-', '');
    const starter = identity(process.pid);
    if (!starter) throw new Error('Cannot establish Linux starter birth identity.');
    await writeFile(
        join(canonical, 'owner.json'),
        JSON.stringify({ token, directory: canonical, starter }),
        { mode: 0o600, flag: 'wx' }
    ).catch(error => {
        throw new Error(
            `This directory is already owned. Use doctor/down or a fresh --dir: ${canonical}`,
            { cause: error }
        );
    });
    let allocation: PortAllocation | undefined;
    let state: StackState | undefined;
    try {
        allocation = await allocatePorts(canonical, token);
        state = {
            version: 2,
            token,
            project: `lcverify-${token}`,
            directory: canonical,
            repo: REPO,
            ports: allocation.ports,
            phase: 'starting',
            createdAt: new Date().toISOString(),
            starter,
        };
        await save(state);
        const current = state;
        const operation = async (args: string[], cwd: string, log?: string, timeoutMs = 30_000) => {
            signal?.throwIfAborted();
            const stopping = await lstat(join(canonical, 'stop-request.json')).then(
                () => true,
                error => {
                    if (error.code === 'ENOENT') return false;
                    throw error;
                }
            );
            if (stopping) throw new Error('Owned stack shutdown was requested.');
            return runCommand(args, cwd, {
                signal,
                log,
                timeoutMs,
                register: pid => registerAuxiliaryProcess(canonical, pid),
                unregister: pid => stopAuxiliaryProcess(canonical, pid),
            });
        };
        progress('allocated', { endpoints: stackEndpoints(state.ports) });
        const bridge = JSON.parse(
            await operation(['docker', 'network', 'inspect', 'bridge'], canonical)
        );
        state.gateway = bridge[0]?.IPAM?.Config?.find((entry: { Gateway?: string }) =>
            /^\d+\.\d+\.\d+\.\d+$/.test(entry.Gateway ?? '')
        )?.Gateway;
        if (!state.gateway)
            throw new Error(
                'Docker default IPv4 bridge gateway is unavailable; localhost did:web resolution needs verified bridge-to-host reachability.'
            );
        const composePath = join(canonical, 'compose.json');
        await writeFile(composePath, JSON.stringify(await composeConfiguration(state), null, 2), {
            mode: 0o600,
            flag: 'wx',
        });
        state.resourcesStarted = true;
        await save(state);
        progress('build', { log: join(canonical, 'build.log') });
        await measure('build', async () => {
            const args = await dockerBuildArguments(
                token,
                args => operation(args, REPO),
                options.builder
            );
            await operation(args, REPO, join(canonical, 'build.log'), 20 * 60_000);
        });
        state.imageId = await operation(
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
        progress('prepare', { log: join(canonical, 'prepare.log') });
        await measure('prepare', () => prepareVerification(canonical, { signal }));
        signal?.throwIfAborted();
        await allocation.release();
        progress('compose', { log: join(canonical, 'compose.log') });
        await measure('compose', () =>
            operation(
                [
                    'docker',
                    'compose',
                    '--project-name',
                    current.project,
                    '--file',
                    composePath,
                    'up',
                    '--detach',
                    '--no-build',
                    '--wait',
                    '--wait-timeout',
                    '240',
                ],
                canonical,
                join(canonical, 'compose.log'),
                300_000
            )
        );
        signal?.throwIfAborted();
        const log = openSync(join(canonical, 'frontend.log'), 'a', 0o600);
        try {
            const child = spawn(
                process.execPath,
                [
                    '--no-env-file',
                    '--no-install',
                    '--conditions=development',
                    join(APP, 'scripts/verification/server.ts'),
                    canonical,
                    token,
                ],
                {
                    cwd: APP,
                    detached: true,
                    stdio: ['ignore', log, log],
                    env: { ...cleanEnvironment(), LC_VERIFY_DIRECTORY: canonical },
                }
            );
            let frontendExit: { code: number | null; signal: NodeJS.Signals | null } | undefined;
            child.once('exit', (code, exitSignal) => {
                frontendExit = { code, signal: exitSignal };
            });
            await new Promise<void>((accept, reject) => {
                child.once('spawn', accept);
                child.once('error', reject);
            });
            // Ownership acquisition is bounded and joined even if cancellation arrives.
            // Otherwise cancellation could leave a live child without a recoverable identity.
            state.frontend = await waitForChildIdentity(child.pid!, {
                expectedArgs: [
                    '--no-env-file',
                    '--no-install',
                    '--conditions=development',
                    join(APP, 'scripts/verification/server.ts'),
                    canonical,
                    token,
                ],
                hasExited: () => frontendExit !== undefined,
            });
            if (!state.frontend)
                throw new Error(
                    `Frontend exited during startup (${JSON.stringify(frontendExit ?? { status: 'exited before identity handshake' })}); see ${join(canonical, 'frontend.log')}`
                );
            signal?.throwIfAborted();
            await registerAuxiliaryProcess(canonical, child.pid!);
            child.unref();
            await save(state);
            signal?.throwIfAborted();
        } finally {
            closeSync(log);
        }
        progress('readiness');
        await measure('readiness', async () => {
            const deadline = Date.now() + 240_000;
            let report: Record<string, unknown> | undefined;
            while (Date.now() < deadline) {
                signal?.throwIfAborted();
                report = await doctorStack(canonical, { signal });
                await writeFile(
                    join(canonical, 'readiness.json'),
                    JSON.stringify(report, null, 2),
                    {
                        mode: 0o600,
                    }
                );
                progress('readiness-probe', { report });
                const services = report.services as Record<
                    string,
                    { fatal?: boolean; state?: { Status?: string } }
                >;
                const failedService = Object.entries(services).find(
                    ([, service]) =>
                        service.fatal ||
                        service.state?.Status === 'exited' ||
                        service.state?.Status === 'dead'
                );
                if (failedService)
                    throw new Error(
                        `${failedService[0]} cannot become ready: ${JSON.stringify(report.failures)}; see ${join(canonical, 'readiness.json')}`
                    );
                if (report.ok) {
                    current.phase = 'ready';
                    await save(current);
                    progress('ready', { endpoints: stackEndpoints(current.ports) });
                    return;
                }
                if (!ownsProcess(current))
                    throw new Error(`Frontend exited; see ${join(canonical, 'frontend.log')}`);
                await sleep(2000, undefined, { signal });
            }
            throw new Error(
                `Readiness failed: ${JSON.stringify(report?.failures)}; retained report ${join(canonical, 'readiness.json')}`
            );
        });
    } catch (error) {
        let diagnosis = '';
        if (state?.resourcesStarted) {
            try {
                const containers = await containersFor(state, AbortSignal.timeout(10_000));
                const failures = SERVICES.flatMap(name => {
                    const container = containers.find(
                        item => item.Config.Labels['com.docker.compose.service'] === name
                    );
                    return !container ||
                        !container.State.Running ||
                        (container.State.Health && container.State.Health.Status !== 'healthy')
                        ? [
                              {
                                  service: name,
                                  state: container?.State ?? 'missing',
                                  log: join(canonical, `${name}.log`),
                              },
                          ]
                        : [];
                });
                await writeFile(
                    join(canonical, 'startup-failure.json'),
                    JSON.stringify({ error: String(error), failures }, null, 2),
                    { mode: 0o600 }
                );
                diagnosis = `; failing service/probes: ${JSON.stringify(failures)}; report ${join(canonical, 'startup-failure.json')}`;
            } catch (probeError) {
                diagnosis = `; Docker diagnostic probe failed: ${String(probeError)}`;
            }
        }
        if (state) {
            state.phase = 'failed';
            state.error = `${String(error)}${diagnosis}`;
            await save(state);
            progress('failed', { error: state.error, logs: canonical });
            try {
                await stopStack(canonical);
            } catch (cleanup) {
                throw new AggregateError(
                    [error, cleanup],
                    `${String(error)}; cleanup failed: ${String(cleanup)}. Evidence: ${canonical}; retry lc verify down --dir ${canonical}`,
                    { cause: cleanup }
                );
            }
        }
        throw new Error(
            `${String(error)}${diagnosis}; retained startup logs and ownership record: ${canonical}`,
            { cause: error }
        );
    } finally {
        await allocation?.release();
    }
};

/** Remove only token-labelled resources; retain ownership, state, logs and browser evidence. */
export const stopStack = async (
    directory: string,
    options: { force?: boolean } = {}
): Promise<void> => {
    let state: StackState;
    try {
        state = await load(directory);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        // Recovery for a crash during port allocation, before state.json was committed.
        let canonical: string;
        try {
            canonical = await realpath(directory);
        } catch (missing) {
            if ((missing as NodeJS.ErrnoException).code === 'ENOENT') return;
            throw missing;
        }
        await privatePath(canonical, true);
        const ownerPath = join(canonical, 'owner.json');
        try {
            await privatePath(ownerPath);
        } catch (missing) {
            if ((missing as NodeJS.ErrnoException).code === 'ENOENT') return;
            throw missing;
        }
        const owner = z
            .object({
                token: z.string().regex(/^[a-f0-9]{32}$/),
                directory: z.literal(canonical),
                starter: ProcessIdentitySchema,
            })
            .parse(JSON.parse(await readFile(ownerPath, 'utf8')));
        if (matchesProcess(owner.starter)) {
            if (!options.force || owner.starter.pid === process.pid)
                throw new Error(
                    'Port allocation is still running; wait for startup or use down --force from another process.',
                    { cause: error }
                );
            if (matchesProcess(owner.starter)) process.kill(owner.starter.pid, 'SIGKILL');
            const deadline = Date.now() + 3000;
            while (matchesProcess(owner.starter) && Date.now() < deadline) await sleep(50);
            if (matchesProcess(owner.starter))
                throw new Error('Verified allocator has not exited; refusing to release claims.', {
                    cause: error,
                });
        }
        const initialized = await lstat(join(canonical, 'state.json')).then(
            () => true,
            missing => {
                if (missing.code === 'ENOENT') return false;
                throw missing;
            }
        );
        if (initialized) return stopStack(canonical, options);
        const composeExists = await lstat(join(canonical, 'compose.json')).then(
            () => true,
            missing => {
                if (missing.code === 'ENOENT') return false;
                throw missing;
            }
        );
        if (composeExists)
            throw new Error(
                'State is missing but Compose configuration exists. Refusing to guess resource ownership; restore the retained state.json before cleanup.',
                { cause: error }
            );
        const lock = join(canonical, 'cleanup.lock');
        await writeFile(lock, '', { mode: 0o600, flag: 'wx' }).catch(failure => {
            if (failure.code !== 'EEXIST') throw failure;
        });
        await privatePath(lock);
        return withDirectoryLock(lock, async () => {
            let paths: string[];
            try {
                await privatePath(PORT_CLAIMS, true);
                paths = await readdir(PORT_CLAIMS);
            } catch (missing) {
                if ((missing as NodeJS.ErrnoException).code === 'ENOENT') return;
                throw missing;
            }
            for (const name of paths) {
                if (!/^\d+\.json$/.test(name)) continue;
                const path = join(PORT_CLAIMS, name);
                await privatePath(path);
                const claim = JSON.parse(await readFile(path, 'utf8'));
                if (claim.token === owner.token && claim.directory === canonical) await rm(path);
            }
        });
    }
    if (state.phase === 'stopped') return;
    const liveStarter =
        state.starter.pid !== process.pid &&
        matchesProcess(state.starter) &&
        (state.phase === 'starting' || state.phase === 'failed');
    if (liveStarter && !options.force)
        throw new Error(
            'Startup is still running. Interrupt its process or use down --force to stop only its verified birth identity and registered children.'
        );
    const requestPath = join(state.directory, 'stop-request.json');
    // The marker is permanent: a still-running starter may never launch new children afterward.
    await writeFile(requestPath, JSON.stringify({ token: state.token }), {
        mode: 0o600,
        flag: 'wx',
    }).catch(error => {
        if (error.code !== 'EEXIST') throw error;
    });
    await privatePath(requestPath);
    const request = JSON.parse(await readFile(requestPath, 'utf8'));
    if (request.token !== state.token) throw new Error('Stop request ownership mismatch.');
    if (liveStarter) {
        // Do not signal its process group: the CLI may share a caller's shell group.
        const saved = state.starter;
        if (matchesProcess(saved)) {
            try {
                process.kill(saved.pid, 'SIGTERM');
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
            }
        }
        const deadline = Date.now() + 3000;
        while (matchesProcess(saved) && Date.now() < deadline) await sleep(50);
        if (matchesProcess(saved)) process.kill(saved.pid, 'SIGKILL');
        const killed = Date.now() + 3000;
        while (matchesProcess(saved) && Date.now() < killed) await sleep(50);
        if (matchesProcess(saved))
            throw new Error(
                'Verified starter did not exit; refusing resource teardown while it could still create resources.'
            );
        state = await load(directory);
    }
    const cleanupLock = join(state.directory, 'cleanup.lock');
    await writeFile(cleanupLock, '', { mode: 0o600, flag: 'wx' }).catch(error => {
        if (error.code !== 'EEXIST') throw error;
    });
    await privatePath(cleanupLock);
    return withDirectoryLock(cleanupLock, async () => {
        state = await load(directory);
        if (state.phase === 'stopped') return;
        // Child registries do not race whole-state writes. Reap them before touching Docker resources.
        const processDirectory = join(state.directory, 'processes');
        const processes = await readdir(processDirectory).catch(error => {
            if (error.code === 'ENOENT') return [] as string[];
            throw error;
        });
        for (const filename of processes) {
            if (!/^[1-9]\d*\.json$/.test(filename))
                throw new Error(
                    `Unrecognized auxiliary record ${filename}; refusing to guess ownership.`
                );
            await stopAuxiliaryProcess(state.directory, Number(filename.slice(0, -5)));
        }
        if (state.frontend) await terminateProcess(state.frontend);
        if (state.resourcesStarted) {
            await verifyDockerTrust();
            // In-flight daemon requests may finish just after their owned client is reaped.
            // Require repeated empty scans; failure retains state for a safe down retry.
            let emptyScans = 0;
            const deadline = Date.now() + 120_000;
            while (emptyScans < 3) {
                if (Date.now() >= deadline)
                    throw new Error(
                        `Owned containers did not settle during cleanup; evidence retained at ${state.directory}`
                    );
                const containers = await containersFor(state);
                if (!containers.length) {
                    emptyScans++;
                    await sleep(1000);
                    continue;
                }
                emptyScans = 0;
                for (const container of containers) {
                    const service = container.Config.Labels['com.docker.compose.service'];
                    const name = service && SERVICES.includes(service) ? service : container.Id;
                    await command(
                        ['docker', 'logs', '--timestamps', container.Id],
                        state.directory,
                        join(state.directory, `${name}.log`)
                    ).catch(async error => {
                        await writeFile(
                            join(state.directory, 'cleanup.log'),
                            `Could not retain ${name} logs: ${String(error)}\n`,
                            { mode: 0o600, flag: 'a' }
                        );
                    });
                    await command(
                        ['docker', 'rm', '--force', '--volumes', container.Id],
                        state.directory
                    );
                }
            }
            for (const kind of ['volume', 'network'] as const) {
                const ids = await command(
                    ['docker', kind, 'ls', '-q', '--filter', `label=${LABEL}=${state.token}`],
                    state.directory
                );
                for (const id of ids.split(/\s+/).filter(Boolean)) {
                    const resources = JSON.parse(
                        await command(['docker', kind, 'inspect', id], state.directory)
                    );
                    if (
                        resources[0]?.Labels?.[LABEL] !== state.token ||
                        resources[0]?.Labels?.['com.docker.compose.project'] !== state.project
                    )
                        throw new Error(`${kind} ownership mismatch; refusing removal.`);
                    await command(['docker', kind, 'rm', id], state.directory);
                }
            }
            const tag = `learncard-verification:${state.token}`;
            const images = await command(
                ['docker', 'image', 'ls', '--quiet', '--no-trunc', tag],
                state.directory
            );
            if (images) {
                const [image] = JSON.parse(
                    await command(['docker', 'image', 'inspect', tag], state.directory)
                );
                if (
                    image?.Config?.Labels?.[LABEL] !== state.token ||
                    (state.imageId && images !== state.imageId)
                )
                    throw new Error('Verification image identity changed; refusing removal.');
                await command(['docker', 'image', 'rm', tag], state.directory);
            }
        }
        for (const port of Object.values(state.ports)) {
            const path = join(PORT_CLAIMS, `${port}.json`);
            try {
                await privatePath(path);
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
                throw error;
            }
            const claim = JSON.parse(await readFile(path, 'utf8'));
            if (
                claim.token !== state.token ||
                claim.directory !== state.directory ||
                claim.port !== port
            )
                throw new Error(
                    `Port ${port} ownership changed; refusing to remove its reservation.`
                );
            await rm(path);
        }
        state.phase = 'stopped';
        await save(state);
    });
};

/** The running container for one owned Compose service, after full ownership validation. */
export const ownedContainer = async (
    directory: string,
    service: string
): Promise<{ id: string; directory: string }> => {
    const state = await load(directory);
    await verifyDockerTrust();
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
