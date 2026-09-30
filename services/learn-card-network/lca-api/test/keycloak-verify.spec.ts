import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { JWTPayload } from 'jose';
import { verifyAuthToken, verifyKeycloakToken } from '../src/helpers/auth.helpers';
import {
    getKeycloakIssuerJwksUrl,
    getKeycloakJwks,
    getKeycloakVerifyOptionsFromEnv,
    setKeycloakJwksResolverForTests,
} from '../src/helpers/keycloak.helpers';

vi.mock('@environment', () => ({
    environment: {
        IS_OFFLINE: true,
        IS_E2E_TEST: true,
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
vi.mock('firebase-admin', () => ({ default: { auth: vi.fn() } }));

const issuer = 'https://identity.example/realms/learncard';
const client = 'learncard-app';
const kid = 'test-key';
let keys: Awaited<ReturnType<typeof generateKeyPair>>;
let otherKeys: Awaited<ReturnType<typeof generateKeyPair>>;
let localJwks: ReturnType<typeof createLocalJWKSet>;
const resolver = vi.fn(() => localJwks);

const signToken = async (
    overrides: JWTPayload = {},
    signingKeys = keys,
    algorithm = 'RS256'
): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT({
        sub: 'user-123',
        iss: issuer,
        aud: client,
        typ: 'ID',
        email: 'learner@example.com',
        email_verified: true,
        exp: now + 300,
        ...overrides,
    })
        .setProtectedHeader({ alg: algorithm, kid, typ: 'JWT' })
        .sign(signingKeys.privateKey);
};

beforeAll(async () => {
    keys = await generateKeyPair('RS256');
    otherKeys = await generateKeyPair('RS256');
    localJwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(keys.publicKey)), kid }] });
});

beforeEach(() => {
    vi.stubEnv('KEYCLOAK_ISSUERS', issuer);
    vi.stubEnv('KEYCLOAK_AUDIENCES', client);
    vi.stubEnv('KEYCLOAK_JWKS_URL_OVERRIDES', '');
    resolver.mockClear();
    setKeycloakJwksResolverForTests(resolver);
});

afterEach(() => {
    setKeycloakJwksResolverForTests(undefined);
    vi.unstubAllEnvs();
});

describe('Keycloak token verification', () => {
    it('accepts ID tokens with a verified email', async () => {
        await expect(verifyKeycloakToken(await signToken())).resolves.toEqual({
            id: 'user-123',
            email: 'learner@example.com',
            phone: undefined,
            providerType: 'keycloak',
        });
    });

    it('accepts access tokens via azp even when aud is account', async () => {
        await expect(
            verifyKeycloakToken(await signToken({ typ: 'Bearer', aud: 'account', azp: client }))
        ).resolves.toMatchObject({ providerType: 'keycloak' });
    });

    it.each([
        ['wrong issuer', { iss: 'https://wrong.example/realms/learncard' }],
        ['same-key issuer outside allowlist', { iss: `${issuer}/` }],
    ])('rejects %s before resolving keys', async (_label, claims) => {
        await expect(verifyKeycloakToken(await signToken(claims))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(resolver).not.toHaveBeenCalled();
    });

    it.each([
        ['wrong audience and azp', { aud: 'account', azp: 'another-client' }],
        ['expired token', { exp: 1 }],
        ['future nbf', { nbf: Math.floor(Date.now() / 1000) + 300 }],
        ['refresh token', { typ: 'Refresh' }],
        ['missing payload typ', { typ: undefined }],
        ['missing subject', { sub: undefined }],
        ['missing audience and azp', { aud: undefined, azp: undefined }],
    ])('rejects %s', async (_label, claims) => {
        await expect(verifyKeycloakToken(await signToken(claims))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Invalid Keycloak token',
        });
    });

    it('rejects a bad signature', async () => {
        await expect(verifyKeycloakToken(await signToken({}, otherKeys))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Invalid Keycloak token',
        });
    });

    it.each([
        ['unverified email', { email_verified: false }, 'Email address is not verified'],
        [
            'missing email verification',
            { email_verified: undefined },
            'Email address is not verified',
        ],
        [
            'unverified phone with verified email',
            { phone_number: '+15555550123', phone_number_verified: false },
            'Phone number is not verified',
        ],
        [
            'missing phone verification',
            { phone_number: '+15555550123' },
            'Phone number is not verified',
        ],
        ['no contact claims', { email: undefined }, 'Token has no verified contact method'],
    ])('rejects %s', async (_label, claims, message) => {
        await expect(verifyKeycloakToken(await signToken(claims))).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message,
        });
    });

    it('accepts a verified phone-only user', async () => {
        const token = await signToken({
            email: undefined,
            phone_number: '+15555550123',
            phone_number_verified: true,
        });
        await expect(verifyKeycloakToken(token)).resolves.toEqual({
            id: 'user-123',
            email: undefined,
            phone: '+15555550123',
            providerType: 'keycloak',
        });
    });

    it('rejects unconfigured verification', async () => {
        vi.stubEnv('KEYCLOAK_ISSUERS', undefined);
        await expect(verifyKeycloakToken(await signToken())).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Keycloak verification is not configured',
        });
    });

    it('dispatches verifyAuthToken to Keycloak', async () => {
        await expect(verifyAuthToken(await signToken(), 'keycloak')).resolves.toMatchObject({
            id: 'user-123',
            providerType: 'keycloak',
        });
    });

    it('accepts audience arrays', async () => {
        await expect(
            verifyKeycloakToken(await signToken({ aud: ['account', client] }))
        ).resolves.toMatchObject({ id: 'user-123' });
    });

    it('rejects malformed tokens without leaking parser errors', async () => {
        await expect(verifyKeycloakToken('not-a-token')).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: 'Invalid Keycloak token',
        });
    });

    it('accepts ES256 signatures', async () => {
        const ecKeys = await generateKeyPair('ES256');
        const ecJwks = createLocalJWKSet({
            keys: [{ ...(await exportJWK(ecKeys.publicKey)), kid }],
        });
        setKeycloakJwksResolverForTests(() => ecJwks);
        await expect(
            verifyKeycloakToken(await signToken({}, ecKeys, 'ES256'))
        ).resolves.toMatchObject({ id: 'user-123' });
    });

    it('rejects algorithms outside the allowlist', async () => {
        const rs512Keys = await generateKeyPair('RS512');
        await expect(
            verifyKeycloakToken(await signToken({}, rs512Keys, 'RS512'))
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });
});

describe('Keycloak configuration', () => {
    it('memoizes remote JWKS by exact issuer without fetching', () => {
        setKeycloakJwksResolverForTests(undefined);
        expect(getKeycloakJwks(issuer)).toBe(getKeycloakJwks(issuer));
        expect(getKeycloakJwks(`${issuer}/other`)).not.toBe(getKeycloakJwks(issuer));
    });

    it('trims allowlists and drops empty entries', () => {
        vi.stubEnv('KEYCLOAK_ISSUERS', ` , ${issuer}, , https://second.example, `);
        vi.stubEnv('KEYCLOAK_AUDIENCES', ' , learncard-app, , another-client, ');
        expect(getKeycloakVerifyOptionsFromEnv()).toEqual({
            issuers: [issuer, 'https://second.example'],
            audiences: [client, 'another-client'],
        });
    });

    it('returns null for empty issuers', () => {
        vi.stubEnv('KEYCLOAK_ISSUERS', ' , , ');
        expect(getKeycloakVerifyOptionsFromEnv()).toBeNull();
    });

    it('fails closed for empty audiences', async () => {
        vi.stubEnv('KEYCLOAK_AUDIENCES', ' , ');
        await expect(verifyKeycloakToken(await signToken())).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('resolves exact-issuer overrides and preserves equals in URLs', () => {
        const url = 'http://keycloak:8080/certs?value=a=b';
        vi.stubEnv(
            'KEYCLOAK_JWKS_URL_OVERRIDES',
            `ignored, ${issuer} = ${url}, https://other.example= `
        );
        expect(getKeycloakIssuerJwksUrl(issuer)).toBe(url);
        expect(getKeycloakIssuerJwksUrl(`${issuer}/`)).toBe(
            `${issuer}//protocol/openid-connect/certs`
        );
        expect(getKeycloakIssuerJwksUrl('https://other.example')).toBe(
            'https://other.example/protocol/openid-connect/certs'
        );
    });
});
