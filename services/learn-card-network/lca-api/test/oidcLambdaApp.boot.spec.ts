import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Boot contract for the dedicated OIDC Lambda. The OIDC function runs under a
 * role that cannot read the runtime-secrets bundle and is deployed without
 * SEED/MONGO/Postmark/Firebase, so its module graph must import and its handler
 * must initialise using ONLY the focused OIDC/cache environments. These tests
 * assert that graph boots with those secrets absent and that the focused schema
 * still enforces the issuer/audience contract.
 */

const BOOT_BLOCKERS = [
    'SEED',
    'MONGO_URI',
    'MONGO_DB_NAME',
    'SA_SEED_KMS_KEY_ARN',
    'SA_SEED_LOCAL_KEK',
    'POSTMARK_SERVER_TOKEN',
    'POSTMARK_FROM_EMAIL',
    'GOOGLE_APPLICATION_CREDENTIAL',
    'RUNTIME_SECRETS_ID',
] as const;

const stubBaseEnv = (): void => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LAMBDA_STAGE', 'prod');
    vi.stubEnv('IS_OFFLINE', 'false');
    vi.stubEnv('IS_E2E_TEST', 'false');
    vi.stubEnv('OIDC_ISSUER', 'https://issuer.test');
    vi.stubEnv('OIDC_CLIENT_ID', 'keycloak-broker');
    vi.stubEnv('OIDC_CLIENT_SECRET', 'secret');
    vi.stubEnv('OIDC_REDIRECT_URIS', '');
    vi.stubEnv('OIDC_SIGNING_KEY_JWK', '');
    vi.stubEnv('OIDC_SIGNING_KEY_SECRET_ID', '');
    vi.stubEnv('KEYCLOAK_ISSUERS', 'https://kc.test/realms/test');
    vi.stubEnv('KEYCLOAK_AUDIENCES', 'account');
    for (const key of BOOT_BLOCKERS) vi.stubEnv(key, '');
};

beforeEach(() => {
    vi.resetModules();
    stubBaseEnv();
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe('OIDC Lambda boot contract', () => {
    it('imports the focused OIDC environment without SEED/MONGO/Postmark present', async () => {
        for (const key of BOOT_BLOCKERS) expect(process.env[key]).toBe('');

        const module = await import('../src/config/oidcEnvironment');

        expect(module.environment.OIDC_ISSUER).toBe('https://issuer.test');
        expect(module.environment.OIDC_CLIENT_ID).toBe('keycloak-broker');
        expect(module.environment.KEYCLOAK_AUDIENCES).toBe('account');
    });

    it('imports the focused cache environment without SEED/MONGO present', async () => {
        const module = await import('../src/config/cacheEnvironment');

        expect(module.environment.REDIS_HOST).toBeUndefined();
        expect(module.environment.REDIS_PORT).toBeUndefined();
    });

    it('boots the OIDC handler module graph with core boot secrets absent', async () => {
        const lambdaApp = await import('../oidcLambdaApp');

        expect(typeof lambdaApp.oidcHandler).toBe('function');
    });

    it('builds the OIDC Fastify app without touching the full environment schema', async () => {
        const fullSchema = vi.fn();
        vi.doMock('../src/config/environment', () => {
            fullSchema();
            throw new Error('full environment schema must not load on the OIDC boot path');
        });

        const module = await import('../src/oidc');
        expect(typeof module.app.inject).toBe('function');
        expect(fullSchema).not.toHaveBeenCalled();

        vi.doUnmock('../src/config/environment');
    });

    it('enforces the issuer requires audience contract in the focused schema', async () => {
        const { parseOidcEnvironment } = await import('../src/config/oidcEnvironment');

        expect(() =>
            parseOidcEnvironment({
                KEYCLOAK_ISSUERS: 'https://kc.test/realms/test',
                KEYCLOAK_AUDIENCES: '',
            })
        ).toThrow(/KEYCLOAK_AUDIENCES/);

        expect(() =>
            parseOidcEnvironment({
                KEYCLOAK_ISSUERS: 'https://kc.test/realms/test',
                KEYCLOAK_AUDIENCES: 'account',
            })
        ).not.toThrow();
    });
});
