import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const functions: {
    api: () => Record<string, string>;
    oidc: () => Record<string, string>;
} = require('../../serverless.function-env.cjs');
const yaml = require('js-yaml');
const config = yaml.load(readFileSync(new URL('../../serverless.yml', import.meta.url), 'utf8'));

const authKeys = [
    'KEYCLOAK_ISSUERS',
    'KEYCLOAK_AUDIENCES',
    'KEYCLOAK_JWKS_URL_OVERRIDES',
    'GOOGLE_OAUTH_CLIENT_IDS',
    'APPLE_OAUTH_CLIENT_IDS',
];
const oidcKeys = [
    'KEYCLOAK_ISSUERS',
    'KEYCLOAK_AUDIENCES',
    'OIDC_ISSUER',
    'OIDC_CLIENT_ID',
    'OIDC_CLIENT_SECRET',
    'OIDC_REDIRECT_URIS',
    'OIDC_SIGNING_KEY_SECRET_ID',
];
const relayKeys = ['ESCROW_RELAY_URL', 'ESCROW_RELAY_AUTH_TOKEN'];
const enclaveKeys = [
    'ESCROW_ENCLAVE_MODE',
    'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
    'ESCROW_ENCLAVE_ACTIVE_KEY_ID',
    'ESCROW_HOLD_DURATION_MS',
    'ESCROW_HOLD_RESTART_MIN_AGE_MS',
];
const keys = [
    ...authKeys,
    ...oidcKeys,
    ...relayKeys,
    ...enclaveKeys,
    'RUNTIME_SECRETS_ID',
    'GOOGLE_APPLICATION_CREDENTIAL',
    'BEDROCK_BASE_URL',
];

beforeEach(() => keys.forEach(key => vi.stubEnv(key, '')));
afterEach(() => vi.unstubAllEnvs());

describe('function environments', () => {
    it('emits the bundle id instead of the Firebase credential', () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('GOOGLE_APPLICATION_CREDENTIAL', 'credential');
        expect(functions.api()).toEqual({ RUNTIME_SECRETS_ID: 'lca-api/dev/runtime-secrets' });
    });
    it('preserves the Firebase fallback when no bundle is provided', () => {
        vi.stubEnv('GOOGLE_APPLICATION_CREDENTIAL', 'credential');
        expect(functions.api()).toEqual({ GOOGLE_APPLICATION_CREDENTIAL: 'credential' });
    });
    it('scopes the optional generation endpoint to API functions', () => {
        vi.stubEnv('BEDROCK_BASE_URL', 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1');
        expect(functions.api()).toEqual({
            BEDROCK_BASE_URL: 'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1',
        });
        expect(functions.oidc()).toEqual({});
    });
    it('omits empty keys', () => {
        expect(functions.api()).toEqual({});
        expect(functions.oidc()).toEqual({});
    });
    it('gives API and OIDC only their own keys', () => {
        [...authKeys, ...oidcKeys].forEach(key => vi.stubEnv(key, key));
        vi.stubEnv('RUNTIME_SECRETS_ID', 'bundle');
        expect(functions.api()).toEqual({
            ...Object.fromEntries(authKeys.map(key => [key, key])),
            RUNTIME_SECRETS_ID: 'bundle',
        });
        expect(functions.oidc()).toEqual(Object.fromEntries(oidcKeys.map(key => [key, key])));
    });
    it('keeps relay settings independent and gates enclave settings on mode', () => {
        [...relayKeys, ...enclaveKeys].forEach(key => vi.stubEnv(key, key));
        vi.stubEnv('ESCROW_ENCLAVE_MODE', '');
        expect(functions.api()).toEqual(Object.fromEntries(relayKeys.map(key => [key, key])));
        vi.stubEnv('ESCROW_ENCLAVE_MODE', 'software');
        expect(functions.api()).toEqual({
            ...Object.fromEntries([...relayKeys, ...enclaveKeys].map(key => [key, key])),
            ESCROW_ENCLAVE_MODE: 'software',
        });
        expect(functions.oidc()).toEqual({});
    });
    it('resolves named function exports with the installed Serverless v3 file resolver', async () => {
        const source = require('serverless/lib/configuration/variables/sources/file');
        vi.stubEnv('RUNTIME_SECRETS_ID', 'bundle');
        for (const name of ['api', 'oidc'] as const) {
            const result = await source.resolve({
                serviceDir: new URL('../../', import.meta.url).pathname,
                params: [new URL('../../serverless.function-env.cjs', import.meta.url).pathname],
                address: name,
                options: {},
                resolveConfigurationProperty: vi.fn(),
                resolveVariable: vi.fn(),
            });
            expect(result.value).toEqual(functions[name]());
        }
    });

    it('keeps bundle-mode environments below 4KB with at least 512 bytes headroom', () => {
        // Fixed synthetic lengths, not deployed values. Count ALL provider keys, even empty ones.
        // Default 40 bytes; longer connection strings/ARNs and secrets are budgeted explicitly.
        const lengths: Record<string, number> = {
            LAMBDA_STAGE: 3,
            PORT: 4,
            REDIS_PORT: 4,
            SEED: 64,
            SA_SEED_KMS_KEY_ARN: 90,
            SA_SEED_ENCRYPT_WRITES: 5,
            SA_SEED_ALLOW_LEGACY_READ: 4,
            MONGO_URI: 160,
            SENTRY_DSN: 100,
            AUTHORIZED_DIDS: 100,
            GOOGLE_APPLICATION_CREDENTIAL: 2400,
            RUNTIME_SECRETS_ID: 90,
            KEYCLOAK_ISSUERS: 60,
            KEYCLOAK_AUDIENCES: 20,
            KEYCLOAK_JWKS_URL_OVERRIDES: 100,
            GOOGLE_OAUTH_CLIENT_IDS: 80,
            APPLE_OAUTH_CLIENT_IDS: 40,
            OIDC_ISSUER: 40,
            OIDC_CLIENT_ID: 20,
            OIDC_CLIENT_SECRET: 64,
            OIDC_REDIRECT_URIS: 80,
            OIDC_SIGNING_KEY_SECRET_ID: 90,
            ESCROW_ENCLAVE_MODE: 8,
            ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON: 160,
            ESCROW_HOLD_DURATION_MS: 9,
            ESCROW_HOLD_RESTART_MIN_AGE_MS: 8,
        };
        const placeholder = (key: string): string => 'x'.repeat(lengths[key] ?? 40);
        keys.forEach(key => vi.stubEnv(key, placeholder(key)));
        const provider = Object.fromEntries(
            Object.keys(config.provider.environment).map(key => [key, placeholder(key)])
        );
        const size = (env: Record<string, string>): number =>
            Object.entries(env).reduce(
                (total, [key, value]) =>
                    total + Buffer.byteLength(key) + Buffer.byteLength(value) + 8,
                0
            );
        const report: Record<string, { bundle: number; fallback: number }> = {};
        for (const name of Object.keys(config.functions)) {
            const scoped = (): Record<string, string> =>
                name === 'trpc' || name === 'api'
                    ? functions.api()
                    : name === 'oidc'
                      ? functions.oidc()
                      : {};
            vi.stubEnv('RUNTIME_SECRETS_ID', placeholder('RUNTIME_SECRETS_ID'));
            const bundle = size({ ...provider, ...scoped() });
            expect(bundle, name).toBeLessThanOrEqual(4096 - 512);
            vi.stubEnv('RUNTIME_SECRETS_ID', '');
            report[name] = { bundle, fallback: size({ ...provider, ...scoped() }) };
        }
        console.table(report);
    });
});
