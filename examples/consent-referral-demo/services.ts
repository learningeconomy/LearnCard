import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const project = 'lc2226-demo';

/** Small Bun containers load this checkout; no monorepo image build is needed. */
export const createDemoCompose = (databaseNetwork?: string): string => {
    const common = {
        image: 'oven/bun:1.3.14',
        networks: ['learn-card'],
        volumes: [`${root}:${root}:ro`],
        extra_hosts: ['localhost:host-gateway', 'host.docker.internal:host-gateway'],
    };
    const runtime = (directory: string, port: number, environment: Record<string, string>) => ({
        ...common,
        working_dir: join(root, 'services/learn-card-network', directory),
        command: ['bun', '--conditions=development', 'src/docker-entry.ts'],
        ports: [`127.0.0.1:${port}:${port}`],
        environment: {
            ...environment,
            PORT: String(port),
            SKIP_DIDKIT_NAPI: '1',
            SKIP_SKILL_FRAMEWORK_SEED: 'true',
        },
    });
    const services: Record<string, Record<string, unknown>> = {
        brain: runtime('brain-service', 4000, {
            SEED: 'a',
            DOMAIN_NAME: 'localhost%3A4000',
            IS_OFFLINE: 'true',
            IS_E2E_TEST: 'true',
            NEO4J_URI: 'bolt://neo4j:7687',
            NEO4J_USERNAME: 'neo4j',
            NEO4J_PASSWORD: 'this-is-the-password',
            REDIS_HOST: 'redis',
            REDIS_PORT: '6379',
            LOGIN_PROVIDER_DID: 'did:web:localhost%3A5200',
            AWS_ACCESS_KEY_ID: 'notARealKey',
            AWS_SECRET_ACCESS_KEY: 'notARealSecretKey',
            AWS_REGION: 'us-east-1',
            NOTIFICATIONS_QUEUE_URL: 'http://elasticmq:9324/notifications',
            NOTIFICATIONS_QUEUE_POLL_URL: 'http://elasticmq:9324/notifications',
            NOTIFICATIONS_SERVICE_PORT: '5200',
            SKILLS_PROVIDER_BASE_URL: 'http://localhost:4000',
            SKILLS_PROVIDER_API_KEY: 'notARealKey',
        }),
        cloud: runtime('learn-cloud-service', 4100, {
            LEARN_CLOUD_SEED: 'b',
            LEARN_CLOUD_MONGO_URI: 'mongodb://mongodb:27017?ssl=false&replicaSet=rs0',
            LEARN_CLOUD_MONGO_DB_NAME: 'learn-cloud',
            REDIS_HOST: 'redis2',
            REDIS_PORT: '6379',
            SERVER_URL: 'http://cloud:4100',
            JWT_SIGNING_KEY: 'test',
        }),
        'lca-api': runtime('lca-api', 5200, {
            SEED: 'd',
            IS_OFFLINE: 'true',
            IS_E2E_TEST: 'true',
            AUTHORIZED_DIDS: 'did:web:localhost%3A4000',
            MONGO_URI: 'mongodb://mongodb:27017?ssl=false&replicaSet=rs0',
            MONGO_DB_NAME: 'lca-api-e2e',
            REDIS_HOST: 'redis3',
            REDIS_PORT: '6379',
            METABASE_SECRET_KEY: 'test-key',
            SA_SEED_LOCAL_KEK: 'f'.repeat(64),
            SA_SEED_ENCRYPT_WRITES: 'true',
            SA_SEED_ALLOW_LEGACY_READ: 'false',
        }),
    };
    if (!databaseNetwork) {
        services.neo4j = {
            image: 'neo4j:5',
            volumes: ['neo4j-data:/data'],
            networks: ['learn-card'],
            environment: {
                NEO4J_AUTH: 'none',
                NEO4J_server_memory_heap_initial__size: '128m',
                NEO4J_server_memory_heap_max__size: '512m',
                NEO4J_server_memory_pagecache_size: '128m',
            },
            healthcheck: {
                test: [
                    'CMD-SHELL',
                    'cypher-shell -a bolt://localhost:7687 -u neo4j -p ignored "RETURN 1"',
                ],
                interval: '5s',
                timeout: '10s',
                retries: 30,
            },
        };
        for (const name of ['redis', 'redis2', 'redis3'])
            services[name] = {
                image: 'redis:alpine',
                networks: ['learn-card'],
                healthcheck: {
                    test: ['CMD', 'redis-cli', 'ping'],
                    interval: '5s',
                    timeout: '5s',
                    retries: 30,
                },
            };
        services.mongodb = {
            image: 'mongo:7.0',
            volumes: ['mongo-data:/data/db'],
            networks: ['learn-card'],
            command: ['--replSet', 'rs0', '--bind_ip_all'],
            healthcheck: {
                test: [
                    'CMD-SHELL',
                    `mongosh --quiet --eval "try { rs.status(); if (!db.hello().isWritablePrimary) quit(1) } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb:27017'}]}) }"`,
                ],
                interval: '5s',
                timeout: '20s',
                retries: 30,
            },
        };
        services.elasticmq = { image: 'softwaremill/elasticmq-native', networks: ['learn-card'] };
        services.brain.depends_on = {
            neo4j: { condition: 'service_healthy' },
            redis: { condition: 'service_healthy' },
            elasticmq: { condition: 'service_started' },
        };
        services.cloud.depends_on = {
            mongodb: { condition: 'service_healthy' },
            redis2: { condition: 'service_healthy' },
        };
        services['lca-api'].depends_on = {
            mongodb: { condition: 'service_healthy' },
            redis3: { condition: 'service_healthy' },
        };
    }
    const config = {
        services,
        ...(!databaseNetwork ? { volumes: { 'mongo-data': {}, 'neo4j-data': {} } } : {}),
        networks: {
            'learn-card': databaseNetwork ? { external: true, name: databaseNetwork } : {},
        },
    };
    const path = join(mkdtempSync(join(tmpdir(), 'lc2226-demo-')), 'compose.json');
    writeFileSync(path, JSON.stringify(config), { mode: 0o600 });
    return path;
};

export const runCompose = (path: string, args: string[]): void => {
    const result = spawnSync('docker', ['compose', '-p', project, '-f', path, ...args], {
        stdio: 'inherit',
    });
    if (result.status !== 0)
        throw new Error(
            'Local demo services could not start. Check OrbStack/Docker and free ports 4000, 4100 and 5200.'
        );
};

export const waitForServices = async (): Promise<void> => {
    const deadline = Date.now() + 120_000;
    for (const [port, path] of [
        [4000, '/api/health-check'],
        [4100, '/trpc/utilities.getChallenges'],
        [5200, '/trpc/utilities.getChallenges'],
    ] as const) {
        let ready = false;
        while (Date.now() < deadline) {
            try {
                const response = await fetch(`http://localhost:${port}${path}`, {
                    signal: AbortSignal.timeout(2000),
                });
                ready = port === 4000 ? response.ok : response.status < 500;
                if (ready) break;
            } catch {
                /* Starting. */
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        if (!ready)
            throw new Error(
                `Service on port ${port} is not ready. Inspect docker compose logs for project ${project}.`
            );
    }
};
