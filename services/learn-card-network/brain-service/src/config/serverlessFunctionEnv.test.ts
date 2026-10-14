import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const functions: {
    provider: (input?: {
        options?: Record<string, unknown>;
        env?: NodeJS.ProcessEnv;
    }) => Record<string, unknown>;
} = require('../../serverless.function-env.cjs');

const INFRA_KEYS = {
    LAMBDA_STAGE: 'dev',
    PORT: '3000',
    REDIS_HOST: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'] },
    REDIS_PORT: { 'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'] },
    NOTIFICATIONS_QUEUE_URL: '${construct:notifications-queue.queueUrl}',
    INBOX_QUEUE_URL: '${construct:inbox-queue.queueUrl}',
};

beforeEach(() => {
    vi.stubEnv('RUNTIME_SECRETS_ID', '');
    vi.stubEnv('GIT_SHA', '');
    vi.stubEnv('SEED', 'seed');
    vi.stubEnv('NEO4J_PASSWORD', 'neo4j-password');
    vi.stubEnv('SHARE_LINK_REQUEST_HASH_SECRET', 'hash-secret');
    vi.stubEnv('SENTRY_AUTH_TOKEN', 'build-token');
    vi.stubEnv('TRUSTED_ISSUERS_WHITELIST', 'did:web:issuer');
});
afterEach(() => vi.unstubAllEnvs());

describe('brain-service serverless provider environment', () => {
    it('always emits Redis and queue infrastructure as unresolved references', () => {
        expect(functions.provider({ options: { stage: 'dev' } })).toMatchObject(INFRA_KEYS);
    });

    it('derives LAMBDA_STAGE and PORT from the CLI options, never a stage passthrough', () => {
        const result = functions.provider({ options: { stage: 'production', httpPort: 4000 } });
        expect(result.LAMBDA_STAGE).toBe('production');
        expect(result.PORT).toBe('4000');
    });

    it('defaults LAMBDA_STAGE and PORT when no CLI options are supplied', () => {
        const result = functions.provider();
        expect(result.LAMBDA_STAGE).toBe('dev');
        expect(result.PORT).toBe('3000');
    });

    it('emits GIT_SHA only when it is set to a non-empty value', () => {
        expect(functions.provider()).not.toHaveProperty('GIT_SHA');
        vi.stubEnv('GIT_SHA', 'deadbeef');
        expect(functions.provider()).toMatchObject({ GIT_SHA: 'deadbeef' });
    });

    it('omits every fallback credential and the pointer stays set in bundle mode', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'brain-service/dev/runtime-secrets');
        const result = functions.provider({ options: { stage: 'dev' } });
        expect(result).toMatchObject({
            ...INFRA_KEYS,
            RUNTIME_SECRETS_ID: 'brain-service/dev/runtime-secrets',
        });
        expect(result).not.toHaveProperty('SEED');
        expect(result).not.toHaveProperty('NEO4J_PASSWORD');
        expect(result).not.toHaveProperty('SHARE_LINK_REQUEST_HASH_SECRET');
    });

    it('retains only the approved fallback credentials when no bundle is configured', () => {
        const result = functions.provider();
        expect(result.SEED).toBe('seed');
        expect(result.NEO4J_PASSWORD).toBe('neo4j-password');
        expect(result.SHARE_LINK_REQUEST_HASH_SECRET).toBe('hash-secret');
        expect(result.RUNTIME_SECRETS_ID).toBeUndefined();
    });

    it('never forwards Sentry build credentials or non-secret allowlists as fallbacks', () => {
        const result = functions.provider();
        expect(result).not.toHaveProperty('SENTRY_AUTH_TOKEN');
        expect(result).not.toHaveProperty('SENTRY_ORG');
        expect(result).not.toHaveProperty('SENTRY_PROJECT');
        expect(result).not.toHaveProperty('TRUSTED_ISSUERS_WHITELIST');
        expect(result).not.toHaveProperty('TRUSTED_BRAIN_SERVICES');
        expect(result).not.toHaveProperty('BRAIN_SERVICE_REGISTRY_URL');
        expect(result).not.toHaveProperty('DCC_KNOWN_REGISTRIES_URL');
    });

    it('resolves the provider through Serverless v3, preserving nested references in both modes', async () => {
        const source = require('serverless/lib/configuration/variables/sources/file');
        for (const bundle of ['', 'bundle']) {
            vi.stubEnv('RUNTIME_SECRETS_ID', bundle);
            const result = await source.resolve({
                serviceDir: new URL('../../', import.meta.url).pathname,
                params: [new URL('../../serverless.function-env.cjs', import.meta.url).pathname],
                address: 'provider',
                options: { stage: 'dev' },
                resolveConfigurationProperty: vi.fn(),
                resolveVariable: vi.fn(),
            });
            expect(result.value).toEqual(functions.provider({ options: { stage: 'dev' } }));
            expect(result.value.NOTIFICATIONS_QUEUE_URL).toBe(
                '${construct:notifications-queue.queueUrl}'
            );
            expect(result.value.INBOX_QUEUE_URL).toBe('${construct:inbox-queue.queueUrl}');
        }
    });
});
