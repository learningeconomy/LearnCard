import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalJWKSet, exportJWK, generateKeyPair, jwtVerify } from 'jose';
import { app } from '../src/oidc';
import { issueLoginTicket, redeemLoginTicket } from '../src/cache/login-tickets';

const { env, entries } = vi.hoisted(() => ({
    env: {
        NODE_ENV: 'test',
        IS_OFFLINE: false,
        IS_E2E_TEST: false,
        OIDC_ISSUER: 'https://issuer.test',
        OIDC_SIGNING_KEY_JWK: '',
        OIDC_CLIENT_ID: 'keycloak-broker',
        OIDC_CLIENT_SECRET: 'secret',
        OIDC_REDIRECT_URIS: '',
        KEYCLOAK_ISSUERS: 'https://kc.test/realms/test',
    },
    entries: new Map<string, { value: string; expires: number }>(),
}));
vi.mock('@environment', () => ({ environment: env }));
vi.mock('@cache', () => {
    const get = async (key: string): Promise<string | null> => {
        const entry = entries.get(key);
        return entry && entry.expires > Date.now() ? entry.value : null;
    };
    return {
        default: {
            get,
            set: async (key: string, value: string, ttl: number): Promise<void> => {
                entries.set(key, { value, expires: Date.now() + ttl * 1000 });
            },
            node: {
                getdel: async (key: string): Promise<string | null> => {
                    const value = await get(key);
                    entries.delete(key);
                    return value;
                },
            },
        },
    };
});

const redirectUri = 'https://kc.test/realms/test/broker/lca-api/endpoint';
let privateJwk: string;
const authorize = (overrides: Record<string, string> = {}) =>
    app.inject({
        method: 'GET',
        url: `/oidc/authorize?${new URLSearchParams({
            client_id: env.OIDC_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid email profile phone',
            state: 'a & b',
            nonce: 'nonce',
            ...overrides,
        })}`,
    });
const ticket = () =>
    issueLoginTicket({
        subject: 'stable-subject',
        identityKey: 'email:test@example.com',
        email: 'test@example.com',
        emailVerified: true,
        name: 'Test',
        picture: 'https://image.test/p',
        phoneNumber: '+15555550100',
        phoneNumberVerified: true,
    });
const code = async (): Promise<string> => {
    const response = await authorize({ login_hint: await ticket() });
    return new URL(response.headers.location!).searchParams.get('code')!;
};
const exchange = (value: string, overrides: Record<string, string> = {}, basic = false) =>
    app.inject({
        method: 'POST',
        url: '/oidc/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            ...(basic
                ? {
                      authorization: `Basic ${Buffer.from(`${encodeURIComponent(env.OIDC_CLIENT_ID)}:${encodeURIComponent(env.OIDC_CLIENT_SECRET)}`).toString('base64')}`,
                  }
                : {}),
        },
        payload: new URLSearchParams({
            grant_type: 'authorization_code',
            code: value,
            redirect_uri: redirectUri,
            ...(!basic
                ? { client_id: env.OIDC_CLIENT_ID, client_secret: env.OIDC_CLIENT_SECRET }
                : {}),
            ...overrides,
        }).toString(),
    });

beforeAll(async () => {
    const keys = await generateKeyPair('RS256', { extractable: true });
    privateJwk = JSON.stringify({
        ...(await exportJWK(keys.privateKey)),
        kid: 'test-key',
        alg: 'RS256',
    });
});
beforeEach(() => {
    entries.clear();
    Object.assign(env, {
        NODE_ENV: 'test',
        IS_OFFLINE: false,
        IS_E2E_TEST: false,
        OIDC_ISSUER: 'https://issuer.test',
        OIDC_SIGNING_KEY_JWK: privateJwk,
        OIDC_CLIENT_ID: 'keycloak-broker',
        OIDC_CLIENT_SECRET: 'secret',
        OIDC_REDIRECT_URIS: '',
        KEYCLOAK_ISSUERS: 'https://kc.test/realms/test',
    });
});
afterAll(async () => {
    await app.close();
});

describe('OIDC provider', () => {
    it('serves discovery with the exact issuer and userinfo endpoint', async () => {
        const response = await app.inject('/.well-known/openid-configuration');
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            issuer: env.OIDC_ISSUER,
            userinfo_endpoint: `${env.OIDC_ISSUER}/oidc/userinfo`,
            response_types_supported: ['code'],
            id_token_signing_alg_values_supported: ['RS256'],
            token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
        });
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
    it('publishes only a public RSA JWK with kid and cache control', async () => {
        const response = await app.inject('/oidc/jwks');
        expect(response.headers['cache-control']).toBe('public, max-age=300');
        expect(response.json().keys[0]).toMatchObject({
            kid: 'test-key',
            alg: 'RS256',
            kty: 'RSA',
        });
        for (const field of ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth'])
            expect(response.json().keys[0][field]).toBeUndefined();
    });
    it.each<Record<string, string>>([
        { client_id: 'wrong' },
        { redirect_uri: 'https://evil.test/' },
        { redirect_uri: `${redirectUri}?x=1` },
        { redirect_uri: `${redirectUri}#fragment` },
        { redirect_uri: `${redirectUri}/suffix` },
    ])('never redirects an unregistered client/URI %j', async overrides => {
        const response = await authorize(overrides);
        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: 'invalid_request' });
        expect(response.headers.location).toBeUndefined();
    });
    it('rejects every redirect when both allowlists are empty', async () => {
        env.KEYCLOAK_ISSUERS = '';
        expect((await authorize()).statusCode).toBe(400);
    });
    it('uses an explicit exact allowlist instead of the issuer fallback', async () => {
        env.OIDC_REDIRECT_URIS = 'https://allowed.test/callback';
        expect((await authorize()).statusCode).toBe(400);
        expect((await authorize({ redirect_uri: env.OIDC_REDIRECT_URIS })).statusCode).toBe(302);
    });
    it.each(['', 'invalid-ticket'])(
        'returns login_required for missing/invalid ticket %s',
        async login_hint => {
            const response = await authorize({ login_hint });
            const url = new URL(response.headers.location!);
            expect(response.statusCode).toBe(302);
            expect(url.searchParams.get('error')).toBe('login_required');
            expect(url.searchParams.get('state')).toBe('a & b');
            expect(response.headers['cache-control']).toBe('no-store');
        }
    );
    it('expires tickets after 60 seconds', async () => {
        const value = await ticket();
        entries.get(`login-ticket:${value}`)!.expires = Date.now() - 1;
        expect(
            new URL((await authorize({ login_hint: value })).headers.location!).searchParams.get(
                'error'
            )
        ).toBe('login_required');
    });
    it('returns a code and preserves state once only', async () => {
        const value = await ticket();
        const response = await authorize({ login_hint: value });
        const url = new URL(response.headers.location!);
        expect(url.searchParams.get('code')).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(url.searchParams.get('state')).toBe('a & b');
        expect(await redeemLoginTicket(value)).toBeNull();
    });
    it.each([
        [{ response_type: 'token' }, 'unsupported_response_type'],
        [{ scope: 'email' }, 'invalid_scope'],
    ] as const)('rejects invalid OAuth parameters %j', async (overrides, error) => {
        const response = await authorize(overrides);
        expect(new URL(response.headers.location!).searchParams.get('error')).toBe(error);
    });
    it.each([true, false])(
        'exchanges a code using Basic=%s and verifies RS256 through served JWKS',
        async basic => {
            const response = await exchange(await code(), {}, basic);
            expect(response.statusCode).toBe(200);
            const tokens = response.json();
            const jwks = (await app.inject('/oidc/jwks')).json();
            const { payload, protectedHeader } = await jwtVerify(
                tokens.id_token,
                createLocalJWKSet(jwks),
                {
                    issuer: env.OIDC_ISSUER,
                    audience: env.OIDC_CLIENT_ID,
                }
            );
            expect(protectedHeader).toMatchObject({ alg: 'RS256', typ: 'JWT', kid: 'test-key' });
            expect(payload).toMatchObject({
                sub: 'stable-subject',
                nonce: 'nonce',
                email: 'test@example.com',
                email_verified: true,
            });
            expect(payload.proof).toBeUndefined();
            expect(payload.exp! - payload.iat!).toBe(300);
            expect(tokens).toMatchObject({
                token_type: 'Bearer',
                expires_in: 300,
                scope: 'openid email profile phone',
            });
            expect(tokens.access_token).not.toBe(tokens.id_token);
            expect(response.headers.pragma).toBe('no-cache');
        }
    );
    it('URL-decodes Basic client credentials', async () => {
        env.OIDC_CLIENT_SECRET = 'a+b:c %';
        expect((await exchange(await code(), {}, true)).statusCode).toBe(200);
    });
    it('rejects a wrong client secret', async () => {
        const response = await exchange(await code(), { client_secret: 'wrong' });
        expect(response.statusCode).toBe(401);
        expect(response.headers['www-authenticate']).toBe('Basic realm="oidc"');
        expect(response.json()).toEqual({ error: 'invalid_client' });
    });
    it('rejects unsupported grants', async () => {
        expect((await exchange('x', { grant_type: 'password' })).json()).toEqual({
            error: 'unsupported_grant_type',
        });
    });
    it('rejects missing code', async () => {
        expect((await exchange('')).json()).toEqual({ error: 'invalid_request' });
    });
    it('rejects unknown codes', async () => {
        expect((await exchange('unknown')).json()).toEqual({ error: 'invalid_grant' });
    });
    it('rejects code replay', async () => {
        const value = await code();
        expect((await exchange(value)).statusCode).toBe(200);
        expect((await exchange(value)).json()).toEqual({ error: 'invalid_grant' });
    });
    it('rejects mismatched redirect URIs', async () => {
        expect(
            (await exchange(await code(), { redirect_uri: 'https://wrong.test/' })).json()
        ).toEqual({ error: 'invalid_grant' });
    });
    it('serves userinfo from opaque access tokens without nonce or identityKey', async () => {
        const tokens = (await exchange(await code())).json();
        const response = await app.inject({
            url: '/oidc/userinfo',
            headers: { authorization: `Bearer ${tokens.access_token}` },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            sub: 'stable-subject',
            email: 'test@example.com',
            email_verified: true,
            name: 'Test',
            picture: 'https://image.test/p',
            phone_number: '+15555550100',
            phone_number_verified: true,
        });
        expect(entries.has(`oidc:access:${tokens.access_token}`)).toBe(true);
    });
    it.each(['', 'Bearer invalid'])(
        'rejects invalid userinfo credentials %s',
        async authorization => {
            const response = await app.inject({
                url: '/oidc/userinfo',
                headers: { authorization },
            });
            expect(response.statusCode).toBe(401);
            expect(response.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
        }
    );
    it.each([
        '/.well-known/openid-configuration',
        '/oidc/jwks',
        '/oidc/authorize',
        '/oidc/userinfo',
    ])('fails closed without issuer on %s', async url => {
        env.OIDC_ISSUER = '';
        const response = await app.inject(url);
        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual({ error: 'server_error' });
    });
    it('fails closed without a production signing key', async () => {
        env.NODE_ENV = 'production';
        env.OIDC_SIGNING_KEY_JWK = '';
        expect((await app.inject('/oidc/jwks')).statusCode).toBe(503);
        expect((await exchange('x')).statusCode).toBe(503);
    });
    it('fails closed without client secret', async () => {
        env.OIDC_CLIENT_SECRET = '';
        expect((await exchange('x')).statusCode).toBe(503);
    });
    it('generates one ephemeral development key when unset', async () => {
        env.OIDC_SIGNING_KEY_JWK = '';
        const first = (await app.inject('/oidc/jwks')).json();
        expect(first.keys[0].kty).toBe('RSA');
        expect((await app.inject('/oidc/jwks')).json()).toEqual(first);
    });
});
