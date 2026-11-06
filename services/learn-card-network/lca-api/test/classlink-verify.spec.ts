import { createServer, type Server } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from 'jose';
import axios from 'axios';
import cache from '@cache';
import {
    exchangeClassLinkCode,
    getClassLinkDiscovery,
    getClassLinkEmail,
    verifyClassLinkIdToken,
    type ClassLinkClaims,
} from '../src/helpers/classlink.helpers';
import { apiFieldsResolver, resolveStateStudentId } from '../src/helpers/classlink.stateId';
import {
    ClassLinkEmailMissing,
    ClassLinkProviderUnavailable,
    ClassLinkStateIdMissing,
    ClassLinkTokenInvalid,
} from '../src/helpers/classlink.errors';

const { env, entries } = vi.hoisted(() => ({
    env: {
        CLASSLINK_CLIENT_ID: 'client-test',
        CLASSLINK_CLIENT_SECRET: 'secret+&=test',
        CLASSLINK_DISCOVERY_URL: 'https://classlink.test/discovery',
        CLASSLINK_REDIRECT_URIS: 'https://app.test/callback',
        CLASSLINK_TENANTS: JSON.stringify({
            'tenant-test': {
                displayName: 'Example District',
                state: 'XX',
                stateStudentIdField: 'student_id',
                allowedEmailDomains: ['example.edu'],
                transcriptEnabled: true,
            },
        }),
        CLASSLINK_MAX_AUTH_AGE_SECONDS: 86400,
        LAMBDA_STAGE: undefined as string | undefined,
        NODE_ENV: 'test',
    },
    entries: new Map<string, { value: string; expires: number }>(),
}));
vi.mock('@environment', () => ({ environment: env }));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@cache', () => ({
    default: {
        get: vi.fn(async (key: string) => {
            const entry = entries.get(key);
            return entry && entry.expires > Date.now() ? entry.value : null;
        }),
        set: vi.fn(async (key: string, value: string, ttl: number) => {
            entries.set(key, { value, expires: Date.now() + ttl * 1000 });
            return 'OK';
        }),
    },
}));

const tenant = JSON.parse(env.CLASSLINK_TENANTS)['tenant-test'];
let server: Server;
let baseUrl: string;
let privateKey: CryptoKey;
let otherKey: CryptoKey;
let publicJwk: JWK;
let keys: JWK[];
let jwksRequests = 0;
let sequence = 0;
let discovery: {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
};
const now = (): number => Math.floor(Date.now() / 1000);
const claims = (overrides: Record<string, unknown> = {}): ClassLinkClaims =>
    ({
        iss: 'https://classlink.test',
        aud: 'client-test',
        sub: 'subject-test',
        iat: now(),
        exp: now() + 600,
        nonce: 'nonce-test',
        classLink_tenant_id: 'tenant-test',
        classLink_sourcedId: 'student-test',
        classLink_role: 'student',
        api_fields: { student_id: 'XX1234567890' },
        ...overrides,
    }) as ClassLinkClaims;
const sign = (
    overrides: Record<string, unknown> = {},
    key = privateKey,
    kid = 'key-test'
): Promise<string> =>
    new SignJWT(claims(overrides)).setProtectedHeader({ alg: 'RS256', kid }).sign(key);
const verify = (token: string): Promise<ClassLinkClaims> =>
    verifyClassLinkIdToken(token, { nonce: 'nonce-test' });

beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    otherKey = (await generateKeyPair('RS256')).privateKey;
    publicJwk = { ...(await exportJWK(pair.publicKey)), kid: 'key-test', alg: 'RS256' };
    server = createServer((_request, response) => {
        jwksRequests++;
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ keys }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Test server unavailable');
    baseUrl = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
});
beforeEach(() => {
    vi.clearAllMocks();
    entries.clear();
    keys = [publicJwk];
    jwksRequests = 0;
    discovery = {
        issuer: 'https://classlink.test',
        authorization_endpoint: 'https://classlink.test/authorize',
        token_endpoint: 'https://classlink.test/token',
        jwks_uri: `${baseUrl}/jwks/${sequence++}`,
    };
    vi.mocked(axios.get).mockResolvedValue({ data: discovery });
    vi.mocked(axios.post).mockResolvedValue({
        data: { id_token: 'returned-token', access_token: 'access', token_type: 'Bearer' },
    });
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('ClassLink token verification', () => {
    it('returns verified typed claims', async () => {
        // Compare against the signed claims themselves: a fresh claims() call can cross a
        // second boundary and produce a different iat/exp.
        const expected = claims();
        const token = await new SignJWT(expected)
            .setProtectedHeader({ alg: 'RS256', kid: 'key-test' })
            .sign(privateKey);
        expect(await verify(token)).toMatchObject(expected);
    });
    it.each(['tokens-public.apis.classlink.com', 'https://tokens-public.apis.classlink.com'])(
        'accepts the documented ClassLink token issuer %s alongside discovery',
        async iss => {
            expect(await verify(await sign({ iss }))).toMatchObject({ iss });
        }
    );
    it('normalizes numeric ClassLink tenant and sourced IDs to strings', async () => {
        const result = await verify(
            await sign({ classLink_tenant_id: 123456, classLink_sourcedId: 789 })
        );
        expect(result.classLink_tenant_id).toBe('123456');
        expect(result.classLink_sourcedId).toBe('789');
    });
    it('logs only the failure stage, reason and claim name', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(verify(await sign({ iss: 'https://other.test' }))).rejects.toBeInstanceOf(
            ClassLinkTokenInvalid
        );
        expect(warn).toHaveBeenCalledWith('classlink.verify.failed', {
            stage: 'verify',
            reason: 'ERR_JWT_CLAIM_VALIDATION_FAILED',
            claim: 'iss',
        });
        expect(JSON.stringify(warn.mock.calls)).not.toContain('other.test');
    });
    it.each([
        ['issuer', { iss: 'https://other.test' }],
        ['audience', { aud: 'other-client' }],
        ['expiration', { exp: 1 }],
        ['missing expiration', { exp: undefined }],
        ['missing issued-at', { iat: undefined }],
        ['nonce mismatch', { nonce: 'wrong' }],
        ['missing nonce', { nonce: undefined }],
        ['missing sourcedId', { classLink_sourcedId: undefined }],
        ['blank sourcedId', { classLink_sourcedId: '  ' }],
        ['missing subject', { sub: undefined }],
        ['blank subject', { sub: '' }],
    ])('rejects invalid %s', async (_label, overrides) => {
        await expect(verify(await sign(overrides))).rejects.toBeInstanceOf(ClassLinkTokenInvalid);
    });
    it.each([-301, 301])('rejects issued-at skew %i', async skew => {
        await expect(verify(await sign({ iat: now() + skew }))).rejects.toBeInstanceOf(
            ClassLinkTokenInvalid
        );
    });
    it('accepts issued-at within the skew limit', async () => {
        await expect(verify(await sign({ iat: now() + 299 }))).resolves.toBeDefined();
    });
    it('rejects a second key with the same kid', async () => {
        await expect(verify(await sign({}, otherKey))).rejects.toBeInstanceOf(
            ClassLinkTokenInvalid
        );
    });
    it('refetches an unknown kid after cooldown then fails', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        await verify(await sign());
        expect(jwksRequests).toBe(1);
        vi.setSystemTime(Date.now() + 31000);
        await expect(verify(await sign({}, privateKey, 'missing'))).rejects.toBeInstanceOf(
            ClassLinkTokenInvalid
        );
        expect(jwksRequests).toBe(2);
    });
    it('accepts a rotated key after refetch', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        await verify(await sign());
        keys = [{ ...publicJwk, kid: 'rotated' }];
        vi.setSystemTime(Date.now() + 31000);
        await expect(verify(await sign({}, privateKey, 'rotated'))).resolves.toBeDefined();
        expect(jwksRequests).toBe(2);
    });
    it('rejects HS256', async () => {
        const token = await new SignJWT(claims())
            .setProtectedHeader({ alg: 'HS256' })
            .sign(new TextEncoder().encode('test-secret-with-at-least-32-bytes'));
        await expect(verify(token)).rejects.toBeInstanceOf(ClassLinkTokenInvalid);
    });
    it.each(['unknown-tenant', 'toString', '__proto__'])(
        'accepts a district without an override (%s); policy is applied by the route',
        async tenantId => {
            await expect(
                verify(await sign({ classLink_tenant_id: tenantId }))
            ).resolves.toMatchObject({ classLink_tenant_id: tenantId });
        }
    );
    it('rejects empty expected nonce', async () => {
        await expect(
            verifyClassLinkIdToken(await sign({ nonce: '' }), { nonce: '' })
        ).rejects.toBeInstanceOf(ClassLinkTokenInvalid);
    });
    it('does not expose tokens or state IDs in logs or errors', async () => {
        const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(method =>
            vi.spyOn(console, method).mockImplementation(() => {})
        );
        const token = await sign({ nonce: 'wrong' });
        const error = await verify(token).catch(value => value);
        expect(error).toBeInstanceOf(ClassLinkTokenInvalid);
        const output = JSON.stringify({ calls: spies.map(spy => spy.mock.calls), error });
        expect(output).not.toContain(token);
        expect(output).not.toContain('XX1234567890');
        expect(error.cause).toBeUndefined();
    });
});

describe('email and state student ID', () => {
    it('uses trimmed sourcedId in preference to api fields', async () => {
        expect(
            await resolveStateStudentId(
                claims({
                    classLink_sourcedId: ' 0123456789 ',
                    api_fields: { student_id: 'other' },
                }),
                {
                    ...tenant,
                    stateStudentIdSource: { type: 'sourcedId' },
                    stateStudentIdPattern: '[0-9]{10}',
                }
            )
        ).toBe('0123456789');
    });
    it('uses the explicit API field in preference to the legacy field', async () => {
        expect(
            await resolveStateStudentId(
                claims({ api_fields: { alternate: ' 0123456789 ', student_id: 'other' } }),
                {
                    ...tenant,
                    stateStudentIdSource: { type: 'apiField', field: 'alternate' },
                }
            )
        ).toBe('0123456789');
    });
    it('rejects partial pattern matches and warns without the value', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(
            await resolveStateStudentId(claims({ classLink_sourcedId: 'x0123456789' }), {
                ...tenant,
                stateStudentIdSource: { type: 'sourcedId' },
                stateStudentIdPattern: '[0-9]{10}',
            })
        ).toBeNull();
        expect(warn).toHaveBeenCalledExactlyOnceWith('classlink.state_id.pattern_mismatch', {
            tenantId: 'tenant-test',
        });
    });
    it('prefers normalized email', () =>
        expect(
            getClassLinkEmail(
                claims({ email: ' Student@Example.edu ', or_email: 'other@example.edu' })
            )
        ).toBe('student@example.edu'));
    it('falls back to or_email', () =>
        expect(getClassLinkEmail(claims({ or_email: 'Student@Example.edu' }))).toBe(
            'student@example.edu'
        ));
    it('rejects explicitly unverified email', () =>
        expect(() =>
            getClassLinkEmail(claims({ email: 'student@example.edu', email_verified: false }))
        ).toThrow(ClassLinkEmailMissing));
    it('returns null without email', () => expect(getClassLinkEmail(claims())).toBeNull());
    it.each([{ student_id: ' XX1234567890 ' }, '{"student_id":" XX1234567890 "}'])(
        'resolves object or JSON api_fields',
        async fields => {
            expect(await resolveStateStudentId(claims({ api_fields: fields }), tenant)).toBe(
                'XX1234567890'
            );
        }
    );
    it.each([
        undefined,
        {},
        { student_id: '  ' },
        { student_id: 123 },
        'invalid json',
        'null',
        '[]',
    ])('returns null for absent or malformed state ID: %j', async fields => {
        expect(await apiFieldsResolver.resolve(claims({ api_fields: fields }), tenant)).toBeNull();
    });
    it('uses the configured field only', async () => {
        expect(
            await resolveStateStudentId(claims({ api_fields: { alternate: '00123' } }), {
                ...tenant,
                stateStudentIdField: 'alternate',
            })
        ).toBe('00123');
    });
    describe('test state IDs', () => {
        const testTenant = { ...tenant, testStateStudentIds: true };
        const noStateId = claims({ api_fields: {} });
        it.each(['test', 'production'])(
            'applies fallback after mismatch only on test stages: %s',
            async stage => {
                env.LAMBDA_STAGE = stage;
                const result = await resolveStateStudentId(noStateId, {
                    ...testTenant,
                    stateStudentIdSource: { type: 'sourcedId' },
                    stateStudentIdPattern: '[0-9]{10}',
                });
                if (stage === 'test') expect(result).toMatch(/^TEST\d{10}$/);
                else expect(result).toBeNull();
            }
        );
        afterEach(() => {
            env.LAMBDA_STAGE = undefined;
            env.NODE_ENV = 'test';
        });
        it('gives each student a stable TEST ID only when the district sends none', async () => {
            env.LAMBDA_STAGE = 'dev';
            const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
            const first = await resolveStateStudentId(noStateId, testTenant);
            expect(first).toMatch(/^TEST\d{10}$/);
            expect(await resolveStateStudentId(noStateId, testTenant)).toBe(first);
            expect(
                await resolveStateStudentId(
                    claims({ api_fields: {}, classLink_sourcedId: 'other' }),
                    testTenant
                )
            ).not.toBe(first);
            expect(
                await resolveStateStudentId(
                    claims({ api_fields: { student_id: 'XX1234567890' } }),
                    testTenant
                )
            ).toBe('XX1234567890');
            expect(info).toHaveBeenCalledWith('classlink.test_state_ids.used', {
                tenantId: 'tenant-test',
            });
        });
        it.each([
            { LAMBDA_STAGE: 'prod', NODE_ENV: 'development' },
            { LAMBDA_STAGE: 'production', NODE_ENV: 'development' },
            { LAMBDA_STAGE: undefined, NODE_ENV: 'production' },
        ])('is ignored outside test stages: %j', async stage => {
            Object.assign(env, stage);
            const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            expect(await resolveStateStudentId(noStateId, testTenant)).toBeNull();
            expect(error).toHaveBeenCalledWith('classlink.test_state_ids.ignored', {
                tenantId: 'tenant-test',
            });
        });
        it('is off unless the district sets it', async () => {
            env.LAMBDA_STAGE = 'dev';
            expect(await resolveStateStudentId(noStateId, tenant)).toBeNull();
        });
    });
});

describe('discovery and code exchange', () => {
    it('caches validated discovery for one hour', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        expect(await getClassLinkDiscovery()).toEqual(discovery);
        await getClassLinkDiscovery();
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(cache.set).toHaveBeenCalledWith(expect.any(String), JSON.stringify(discovery), 3600);
        vi.setSystemTime(Date.now() + 3600001);
        await getClassLinkDiscovery();
        expect(axios.get).toHaveBeenCalledTimes(2);
    });
    it('reports malformed discovery as a provider outage', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(axios.get).mockResolvedValue({ data: { issuer: 'invalid' } });
        await expect(getClassLinkDiscovery()).rejects.toBeInstanceOf(ClassLinkProviderUnavailable);
        expect(error).toHaveBeenCalledWith('classlink.provider.unavailable', {
            stage: 'discovery',
            name: 'ZodError',
        });
    });
    it('reports a discovery network failure as a provider outage with only safe fields', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(axios.get).mockRejectedValue(
            Object.assign(new Error('connect ECONNREFUSED https://secret.example?token=abc'), {
                code: 'ECONNREFUSED',
            })
        );
        const thrown = await getClassLinkDiscovery().catch(value => value);
        expect(thrown).toBeInstanceOf(ClassLinkProviderUnavailable);
        expect(thrown.code).toBe('SERVICE_UNAVAILABLE');
        expect(thrown.cause).toBeUndefined();
        expect(error).toHaveBeenCalledExactlyOnceWith('classlink.provider.unavailable', {
            stage: 'discovery',
            name: 'Error',
            code: 'ECONNREFUSED',
        });
        expect(JSON.stringify(error.mock.calls)).not.toContain('token=abc');
    });
    it('reports an unreachable JWKS as a provider outage, not an invalid token', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        discovery.jwks_uri = 'http://127.0.0.1:1/unreachable-jwks';
        vi.mocked(axios.get).mockResolvedValue({ data: discovery });
        await expect(verify(await sign())).rejects.toBeInstanceOf(ClassLinkProviderUnavailable);
        expect(error).toHaveBeenCalledWith(
            'classlink.provider.unavailable',
            expect.objectContaining({ stage: 'jwks' })
        );
    });
    it('sends client_secret_post with PKCE and a ten second timeout', async () => {
        const result = await exchangeClassLinkCode({
            code: 'code+&=',
            codeVerifier: 'verifier+&=',
            redirectUri: 'https://app.test/callback',
        });
        expect(result.id_token).toBe('returned-token');
        const [url, body, options] = vi.mocked(axios.post).mock.calls[0]!;
        expect(url).toBe(discovery.token_endpoint);
        expect(typeof body).toBe('string');
        expect(Object.fromEntries(new URLSearchParams(String(body)))).toEqual({
            client_id: 'client-test',
            client_secret: 'secret+&=test',
            code: 'code+&=',
            code_verifier: 'verifier+&=',
            grant_type: 'authorization_code',
            redirect_uri: 'https://app.test/callback',
        });
        expect(options).toMatchObject({
            timeout: 10000,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
    });
    it('rejects a redirect outside the exact allowlist before exchange', async () => {
        await expect(
            exchangeClassLinkCode({
                code: 'code',
                codeVerifier: 'verifier',
                redirectUri: 'https://app.test/callback/evil',
            })
        ).rejects.toBeInstanceOf(ClassLinkTokenInvalid);
        expect(axios.post).not.toHaveBeenCalled();
    });
    const exchange = (): Promise<unknown> =>
        exchangeClassLinkCode({
            code: 'code',
            codeVerifier: 'verifier',
            redirectUri: 'https://app.test/callback',
        });
    it('treats a malformed token response as a provider outage', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(axios.post).mockResolvedValue({ data: { id_token: 123 } });
        await expect(exchange()).rejects.toBeInstanceOf(ClassLinkProviderUnavailable);
    });
    it('treats a rejected code (OAuth 400 invalid_grant) as an invalid sign-in', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.mocked(axios.post).mockRejectedValue(
            Object.assign(new Error('Request failed'), {
                response: { status: 400, data: { error: 'invalid_grant' } },
            })
        );
        await expect(exchange()).rejects.toBeInstanceOf(ClassLinkTokenInvalid);
        expect(warn).toHaveBeenCalledWith('classlink.verify.failed', {
            stage: 'exchange',
            httpStatus: 400,
            oauthError: 'invalid_grant',
        });
    });
    it.each([
        ['a 5xx', { status: 503, data: {} }],
        ['a client registration error', { status: 401, data: { error: 'invalid_client' } }],
    ])('reports %s from the token endpoint as a provider outage', async (_label, response) => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(axios.post).mockRejectedValue(
            Object.assign(new Error('Request failed'), { response })
        );
        await expect(exchange()).rejects.toBeInstanceOf(ClassLinkProviderUnavailable);
        expect(error).toHaveBeenCalledWith(
            'classlink.provider.unavailable',
            expect.objectContaining({ stage: 'exchange', httpStatus: response.status })
        );
    });
    it('sanitizes upstream errors rather than retaining request secrets', async () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.mocked(axios.post).mockRejectedValue(new Error('sensitive-code-and-secret'));
        const error = (await exchange().catch(value => value)) as ClassLinkProviderUnavailable;
        expect(error).toBeInstanceOf(ClassLinkProviderUnavailable);
        expect(error.cause).toBeUndefined();
        expect(JSON.stringify(error)).not.toContain('sensitive-code-and-secret');
        expect(JSON.stringify(logged.mock.calls)).not.toContain('sensitive-code-and-secret');
    });
    it('provides typed errors with tRPC codes and message keys', () => {
        for (const ErrorType of [
            ClassLinkEmailMissing,
            ClassLinkStateIdMissing,
            ClassLinkTokenInvalid,
            ClassLinkProviderUnavailable,
        ]) {
            const error = new ErrorType();
            expect(['FORBIDDEN', 'BAD_REQUEST', 'UNAUTHORIZED', 'SERVICE_UNAVAILABLE']).toContain(
                error.code
            );
            expect(error.messageKey).toMatch(/^classlink\./);
        }
    });
});
