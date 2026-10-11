import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const functions: {
    provider: (context?: {
        options: { stage: string; httpPort?: string };
    }) => Record<string, unknown>;
} = require('../../serverless.function-env.cjs');

beforeEach(() => {
    vi.stubEnv('RUNTIME_SECRETS_ID', '');
    vi.stubEnv('LEARN_CLOUD_SEED', 'seed');
    vi.stubEnv('LEARN_CLOUD_MONGO_URI', 'mongodb://localhost:27017');
    // XAPI_ENDPOINT is a user-classified bundle secret, so populate a stale fallback value
    // to prove it never leaks onto the provider once a runtime bundle is configured.
    vi.stubEnv('XAPI_ENDPOINT', 'https://stale.xapi.example.com');
});
afterEach(() => vi.unstubAllEnvs());

describe('learn-cloud-service serverless function environments', () => {
    it('omits all credential fallbacks in bundle mode', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'learn-cloud-service/dev/runtime-secrets');
        expect(Object.keys(functions.provider()).sort()).toEqual([
            'CONFIG_TENANT',
            'LAMBDA_STAGE',
            'PORT',
            'REDIS_HOST',
            'REDIS_PORT',
            'RUNTIME_SECRETS_ID',
        ]);
    });

    it('drops the XAPI_ENDPOINT bundle secret in bundle mode even when a stale fallback is set', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'learn-cloud-service/dev/runtime-secrets');
        expect(functions.provider()).not.toHaveProperty('XAPI_ENDPOINT');
    });

    it('retains the existing provider credentials only in fallback mode', () => {
        const provider = functions.provider();
        expect(provider.LEARN_CLOUD_SEED).toBe('seed');
        expect(provider.LEARN_CLOUD_MONGO_URI).toBe('mongodb://localhost:27017');
        expect(provider.XAPI_ENDPOINT).toBe('https://stale.xapi.example.com');
        expect(provider.RUNTIME_SECRETS_ID).toBeUndefined();
    });

    it('preserves the CloudFormation Redis intrinsics and CLI options', () => {
        const provider = functions.provider({ options: { stage: 'production', httpPort: '5100' } });
        expect(provider.LAMBDA_STAGE).toBe('production');
        expect(provider.PORT).toBe('5100');
        expect(provider.REDIS_HOST).toEqual({
            'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'],
        });
        expect(provider.REDIS_PORT).toEqual({
            'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'],
        });
    });

    it.each(['', 'bundle'])(
        'resolves the full provider environment through Serverless v3 (%s)',
        async bundle => {
            const source = require('serverless/lib/configuration/variables/sources/file');
            vi.stubEnv('RUNTIME_SECRETS_ID', bundle);
            const options = { stage: 'production', httpPort: '5100' };
            const result = await source.resolve({
                serviceDir: new URL('../../', import.meta.url).pathname,
                params: [new URL('../../serverless.function-env.cjs', import.meta.url).pathname],
                address: 'provider',
                options,
                resolveConfigurationProperty: vi.fn(),
                resolveVariable: vi.fn(),
            });
            expect(result.value).toEqual(functions.provider({ options }));
            expect(result.value.LAMBDA_STAGE).toBe('production');
            expect(result.value.PORT).toBe('5100');
            expect(result.value.REDIS_HOST).toEqual({
                'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'],
            });
        }
    );
});
