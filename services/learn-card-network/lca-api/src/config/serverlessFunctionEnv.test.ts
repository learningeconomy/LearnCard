import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const functions: {
    api: () => Record<string, string>;
    oidc: () => Record<string, string>;
    provider: (context?: {
        options: { stage: string; httpPort?: string };
    }) => Record<string, unknown>;
} = require('../../serverless.function-env.cjs');

beforeEach(() => {
    vi.stubEnv('RUNTIME_SECRETS_ID', '');
    vi.stubEnv('SEED', 'seed');
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIAL', 'credential');
    vi.stubEnv('OIDC_CLIENT_SECRET', 'broker-secret');
    vi.stubEnv('OIDC_REDIRECT_URIS', 'https://example.com/callback');
});
afterEach(() => vi.unstubAllEnvs());

describe('lca-api serverless function environments', () => {
    it('omits all fallback credentials in bundle mode', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        expect(functions.api()).toEqual({ RUNTIME_SECRETS_ID: 'lca-api/dev/runtime-secrets' });
        expect(Object.keys(functions.provider()).sort()).toEqual([
            'CONFIG_TENANT',
            'LAMBDA_STAGE',
            'PORT',
            'REDIS_HOST',
            'REDIS_PORT',
            'SA_SEED_KMS_KEY_ARN',
        ]);
    });

    it('keeps the non-secret escrow toggle in bundle mode', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('ESCROW_ENCLAVE_MODE', 'software');
        vi.stubEnv('ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON', '{"k":"secret"}');
        expect(functions.api()).toEqual({
            RUNTIME_SECRETS_ID: 'lca-api/dev/runtime-secrets',
            ESCROW_ENCLAVE_MODE: 'software',
        });
    });

    it('bakes the tenant selector into every function, defaulting to learncard', () => {
        expect(functions.provider().CONFIG_TENANT).toBe('learncard');
        vi.stubEnv('CONFIG_TENANT', 'scouts');
        expect(functions.provider().CONFIG_TENANT).toBe('scouts');
    });

    it('retains the existing provider and API credentials only in fallback mode', () => {
        expect(functions.provider().SEED).toBe('seed');
        expect(functions.api().GOOGLE_APPLICATION_CREDENTIAL).toBe('credential');
        expect(functions.api().RUNTIME_SECRETS_ID).toBeUndefined();
    });

    it('keeps the OIDC exception scoped to its separate role', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'bundle');
        expect(functions.oidc()).toEqual({
            OIDC_CLIENT_SECRET: 'broker-secret',
            OIDC_REDIRECT_URIS: 'https://example.com/callback',
        });
        expect(functions.provider().OIDC_CLIENT_SECRET).toBeUndefined();
        expect(functions.api().OIDC_CLIENT_SECRET).toBeUndefined();
    });

    it.each(['', 'bundle'])(
        'resolves the full provider environment through Serverless v3 (%s)',
        async bundle => {
            const source = require('serverless/lib/configuration/variables/sources/file');
            vi.stubEnv('RUNTIME_SECRETS_ID', bundle);
            const options = { stage: 'production', httpPort: '5100' };
            for (const name of ['provider', 'api', 'oidc'] as const) {
                const result = await source.resolve({
                    serviceDir: new URL('../../', import.meta.url).pathname,
                    params: [
                        new URL('../../serverless.function-env.cjs', import.meta.url).pathname,
                    ],
                    address: name,
                    options,
                    resolveConfigurationProperty: vi.fn(),
                    resolveVariable: vi.fn(),
                });
                const expected =
                    name === 'provider' ? functions.provider({ options }) : functions[name]();
                expect(result.value).toEqual(expected);
                if (name === 'provider') {
                    expect(result.value.LAMBDA_STAGE).toBe('production');
                    expect(result.value.PORT).toBe('5100');
                    expect(result.value.SA_SEED_KMS_KEY_ARN).toEqual({
                        'Fn::GetAtt': ['SigningAuthoritySeedKey', 'Arn'],
                    });
                }
            }
        }
    );
});
