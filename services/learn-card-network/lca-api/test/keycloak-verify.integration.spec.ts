import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// No Firebase credentials or network calls are needed to verify Keycloak tokens.
vi.mock('firebase-admin', () => ({ default: { auth: vi.fn() } }));
vi.mock('@environment', () => ({
    environment: {
        IS_OFFLINE: false,
        IS_E2E_TEST: false,
        get KEYCLOAK_ISSUERS(): string | undefined {
            return process.env.KEYCLOAK_ISSUERS;
        },
        get KEYCLOAK_AUDIENCES(): string | undefined {
            return process.env.KEYCLOAK_AUDIENCES;
        },
        get KEYCLOAK_JWKS_URL_OVERRIDES(): string | undefined {
            return process.env.KEYCLOAK_JWKS_URL_OVERRIDES;
        },
    },
}));

describe.skipIf(process.env.KEYCLOAK_INTEGRATION !== 'true')('real Keycloak tokens', () => {
    let verifyKeycloakToken: typeof import('../src/helpers/auth.helpers').verifyKeycloakToken;
    let verifyAuthToken: typeof import('../src/helpers/auth.helpers').verifyAuthToken;

    beforeAll(async () => {
        // Avoid initializing service configuration at all when this suite is skipped.
        ({ verifyKeycloakToken, verifyAuthToken } = await import('../src/helpers/auth.helpers'));
    });

    afterEach(() => vi.unstubAllEnvs());

    const getToken = async (
        username: string
    ): Promise<{ access_token: string; id_token: string }> => {
        const issuer = process.env.KEYCLOAK_ISSUERS?.split(',')[0];
        if (!issuer) throw new Error('KEYCLOAK_ISSUERS must be set for integration tests');
        const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: 'ci-tests',
                client_secret: 'ci-tests-dev-only-secret',
                username,
                password: 'password',
                scope: 'openid',
            }),
        });
        if (!response.ok) {
            throw new Error(`Token request failed (${response.status}): ${await response.text()}`);
        }
        return response.json();
    };

    it('accepts a verified email ID token through provider dispatch', async () => {
        const { id_token } = await getToken('dev-email');
        const user = await verifyAuthToken(id_token, 'keycloak');
        expect(user.id).toBeTruthy();
        expect(user.email).toBe('dev-email@example.com');
        expect(user.providerType).toBe('keycloak');
    });

    it('preserves phone profile attributes and accepts a phone-only ID token', async () => {
        const { id_token } = await getToken('dev-phone');
        const payload = JSON.parse(Buffer.from(id_token.split('.')[1]!, 'base64url').toString());
        expect(payload.phone_number).toBe('+15555550100');
        expect(payload.phone_number_verified).toBe(true);
        const user = await verifyKeycloakToken(id_token);
        expect(user.phone).toBe('+15555550100');
        expect(user.email).toBeUndefined();
        expect(user.providerType).toBe('keycloak');
    });

    it('accepts a phone-only access token using the authorized party', async () => {
        const { access_token } = await getToken('dev-phone');
        const user = await verifyKeycloakToken(access_token);
        expect(user.phone).toBe('+15555550100');
        expect(user.email).toBeUndefined();
    });

    it('rejects an unverified contact', async () => {
        const { id_token } = await getToken('dev-unverified');
        await expect(verifyKeycloakToken(id_token)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('rejects a tampered signature', async () => {
        const { id_token } = await getToken('dev-email');
        const parts = id_token.split('.');
        const signature = parts[2]!;
        parts[2] = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
        await expect(verifyKeycloakToken(parts.join('.'))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('rejects a client outside the configured audience allowlist', async () => {
        const { id_token } = await getToken('dev-email');
        vi.stubEnv('KEYCLOAK_AUDIENCES', 'some-other-client');
        await expect(verifyKeycloakToken(id_token)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
});
