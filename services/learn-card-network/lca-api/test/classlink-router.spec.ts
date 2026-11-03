import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { classlinkRouter } from '../src/routes/classlink';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import { exchangeClassLinkCode, verifyClassLinkIdToken } from '../src/helpers/classlink.helpers';
import { ClassLinkEmailMissing, ClassLinkTokenInvalid } from '../src/helpers/classlink.errors';
import {
    findClassLinkIdentityByIdentityKey,
    getClassLinkIdentitiesCollection,
} from '../src/models/ClassLinkIdentity';
import {
    getAuthSubjectsCollection,
    getOrCreateAuthSubject,
    findAuthSubjectByIdentityKey,
} from '../src/models/AuthSubject';
import { getContactMethodFromUser, verifyFirebaseToken } from '../src/helpers/auth.helpers';
import type { ClassLinkClaims, ClassLinkConfig } from '../src/types/classlink';

const { env, firebase, counts, windows } = vi.hoisted(() => ({
    env: { IS_E2E_TEST: false, IS_OFFLINE: false },
    firebase: {
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        createCustomToken: vi.fn(),
        auth: vi.fn(),
    },
    counts: new Map<string, number>(),
    windows: new Map<string, number>(),
}));
vi.mock('@environment', () => ({ environment: env }));
vi.mock('../src/firebase', () => ({ default: { auth: firebase.auth } }));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    return { t, openRoute: t.procedure, didAndChallengeRoute: t.procedure };
});
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
}));
vi.mock('../src/helpers/classlink.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.helpers')>()),
    getClassLinkDiscovery: vi.fn(async () => ({
        authorization_endpoint: 'https://school.example/authorize',
    })),
    exchangeClassLinkCode: vi.fn(),
    verifyClassLinkIdToken: vi.fn(),
}));
vi.mock('@cache', () => ({
    default: {
        node: {
            eval: async (script: string, _count: number, key: string, window: number) => {
                if (script.includes("redis.call('INCR'"))
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                if (counts.has(key) && !windows.has(key)) windows.set(key, window);
                return counts.get(key) ?? null;
            },
        },
    },
}));

const identityKey = 'classlink:tenant-test:source-1';
const uid = `classlink_${createHash('sha256').update(identityKey).digest('hex').slice(0, 28)}`;
const redirectUri = 'https://app.example/auth/classlink/callback';
const nativeUri = 'com.example.app://auth/classlink/callback';
const exchange = {
    code: 'private-code',
    codeVerifier: 'v'.repeat(43),
    redirectUri,
    nonce: 'private-nonce',
};
const authorize = {
    redirectUri,
    nonce: exchange.nonce,
    state: 'private-state',
    codeChallenge: 'c'.repeat(43),
};
const caller = (clientIp = 'test-ip') =>
    classlinkRouter.createCaller({
        clientIp,
        domain: 'localhost',
        tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
    });
let config: ClassLinkConfig;
let claims: ClassLinkClaims;

beforeEach(async () => {
    vi.clearAllMocks();
    counts.clear();
    windows.clear();
    env.IS_E2E_TEST = false;
    env.IS_OFFLINE = false;
    config = {
        clientId: 'client-test',
        clientSecret: 'secret-test',
        discoveryUrl: 'https://school.example/discovery',
        redirectUris: [redirectUri, nativeUri],
        maxAuthAgeSeconds: 86400,
        tenants: {
            'tenant-test': {
                displayName: 'Example District',
                state: 'XX',
                stateStudentIdField: 'student_id',
                allowedEmailDomains: ['example.edu'],
                transcriptEnabled: true,
            },
        },
    };
    claims = {
        iss: 'https://school.example',
        aud: 'client-test',
        sub: 'private-sub',
        iat: 1800000000,
        exp: 1800000300,
        auth_time: 1799999999,
        nonce: exchange.nonce,
        classLink_tenant_id: 'tenant-test',
        classLink_sourcedId: 'source-1',
        classLink_role: 'student',
        email: 'student@example.edu',
        email_verified: true,
        name: 'Example Student',
        api_fields: { student_id: 'private-student-id' },
    };
    vi.mocked(getClassLinkConfig).mockImplementation(() => config);
    vi.mocked(exchangeClassLinkCode).mockResolvedValue({ id_token: 'private-id-token' });
    vi.mocked(verifyClassLinkIdToken).mockImplementation(async () => claims);
    firebase.auth.mockReturnValue(firebase);
    firebase.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
    firebase.createUser.mockImplementation(async (user: { uid: string }) => user);
    firebase.createCustomToken.mockImplementation(async (id: string) => `custom-${id}`);
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getAuthSubjectsCollection().deleteMany({});
});
afterEach(() => vi.restoreAllMocks());

describe('ClassLink sign-in broker', () => {
    it.each([redirectUri, nativeUri])('builds an exact-allowlisted PKCE URL for %s', async uri => {
        const { url } = await caller().getAuthorizeUrl({ ...authorize, redirectUri: uri });
        expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
            response_type: 'code',
            client_id: config.clientId,
            scope: 'openid profile email',
            redirect_uri: uri,
            code_challenge: authorize.codeChallenge,
            code_challenge_method: 'S256',
            state: authorize.state,
            nonce: authorize.nonce,
        });
    });
    it.each([`${redirectUri}/`, `${redirectUri}?evil=1`, 'https://evil.example/callback'])(
        'rejects a nonmatching redirect %s',
        async uri => {
            await expect(
                caller().getAuthorizeUrl({ ...authorize, redirectUri: uri })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(
                caller().exchangeCode({ ...exchange, redirectUri: uri })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(exchangeClassLinkCode).not.toHaveBeenCalled();
        }
    );
    it('creates the deterministic Firebase account once and preserves its subject on repeat login', async () => {
        expect(await caller().exchangeCode(exchange)).toEqual({ token: `custom-${uid}` });
        const first = await findClassLinkIdentityByIdentityKey(identityKey);
        firebase.getUserByEmail.mockResolvedValue({ uid, emailVerified: true });
        await caller().exchangeCode(exchange);
        expect(firebase.createUser).toHaveBeenCalledExactlyOnceWith({
            uid,
            email: claims.email,
            emailVerified: true,
            displayName: claims.name,
        });
        expect(firebase.createCustomToken).toHaveBeenLastCalledWith(uid, { classlink: true });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            subject: first?.subject,
            firebaseUid: uid,
            lastAuthTime: new Date(claims.auth_time! * 1000),
            stateStudentId: 'private-student-id',
            isMinorHint: true,
        });
        expect(verifyClassLinkIdToken).toHaveBeenCalledWith('private-id-token', {
            nonce: exchange.nonce,
        });
    });
    it('links only a verified allowed-domain email and adopts its existing subject', async () => {
        const subject = await getOrCreateAuthSubject('email:student@example.edu', {
            email: claims.email,
            emailVerified: true,
        });
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        claims.email = ' Student@Example.edu ';
        await caller().exchangeCode(exchange);
        expect(await findAuthSubjectByIdentityKey(identityKey)).toMatchObject({
            subject: subject.subject,
        });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'existing-user',
            subject: subject.subject,
        });
        expect(firebase.createUser).not.toHaveBeenCalled();
    });
    it.each(['disallowed', 'empty', 'firebase-unverified', 'claim-unverified'])(
        'refuses unsafe linking: %s',
        async reason => {
            firebase.getUserByEmail.mockResolvedValue({
                uid: 'existing-user',
                emailVerified: reason !== 'firebase-unverified',
            });
            if (reason === 'disallowed')
                config.tenants['tenant-test']!.allowedEmailDomains = ['other.edu'];
            if (reason === 'empty') config.tenants['tenant-test']!.allowedEmailDomains = [];
            if (reason === 'claim-unverified') claims.email_verified = false;
            await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
                code: 'CONFLICT',
            });
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toBeNull();
            expect(await findAuthSubjectByIdentityKey(identityKey)).toBeNull();
            expect(firebase.createCustomToken).not.toHaveBeenCalled();
        }
    );
    it('fails closed when a known identity email belongs to another Firebase uid, logging only tenant', async () => {
        await caller().exchangeCode(exchange);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        firebase.getUserByEmail.mockResolvedValue({ uid: 'different-user', emailVerified: true });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(warn).toHaveBeenCalledExactlyOnceWith('classlink.link.conflict', {
            tenantId: 'tenant-test',
        });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: uid,
        });
    });
    it.each(['missing', 'unverified', 'helper-error'])(
        'maps %s email to the friendly error',
        async reason => {
            if (reason === 'missing') delete claims.email;
            if (reason === 'unverified') claims.email_verified = false;
            if (reason === 'helper-error')
                vi.mocked(verifyClassLinkIdToken).mockRejectedValueOnce(
                    new ClassLinkEmailMissing()
                );
            await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message:
                    "Your school account doesn't have an email address yet. Ask your school to add one, then try again.",
            });
            expect(firebase.createUser).not.toHaveBeenCalled();
        }
    );
    it('signs in a district without an override using safe defaults', async () => {
        config.tenants = {};
        expect(await caller().exchangeCode(exchange)).toEqual({ token: `custom-${uid}` });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: uid,
            state: '',
            stateStudentId: null,
        });
    });
    it('never joins an existing email account for a district without an override', async () => {
        config.tenants = {};
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toBeNull();
    });
    it('allows a missing state ID, uses iat fallback, and does not mark staff as minors', async () => {
        delete claims.api_fields;
        delete claims.auth_time;
        claims.classLink_role = 'teacher';
        await caller().exchangeCode(exchange);
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            stateStudentId: null,
            lastAuthTime: new Date(claims.iat * 1000),
            isMinorHint: false,
        });
    });
    it('rejects both procedures when unconfigured', async () => {
        vi.mocked(getClassLinkConfig).mockReturnValue(null);
        await expect(caller().getAuthorizeUrl(authorize)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
    });
    it('limits the 21st failure per IP for ten minutes without counting successes', async () => {
        await caller().exchangeCode(exchange);
        expect(counts.size).toBe(0);
        vi.mocked(verifyClassLinkIdToken).mockRejectedValue(new ClassLinkTokenInvalid());
        for (let i = 0; i < 20; i++)
            await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        await expect(caller('other-ip').exchangeCode(exchange)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(windows.get('classlink:rate:exchange:test-ip')).toBe(600);
        expect(counts.get('classlink:rate:exchange:test-ip')).toBe(20);
    });
    it('explicitly bypasses Firebase in E2E and returns a stable stub', async () => {
        env.IS_E2E_TEST = true;
        expect(await caller().exchangeCode(exchange)).toEqual({ token: `classlink-e2e-${uid}` });
        expect(await caller().exchangeCode(exchange)).toEqual({ token: `classlink-e2e-${uid}` });
        expect(firebase.auth).not.toHaveBeenCalled();
        expect(firebase.createCustomToken).not.toHaveBeenCalled();
    });
    it('proves offline recovery contact extraction for a custom-sign-in ID-token-shaped payload', async () => {
        await caller().exchangeCode(exchange);
        env.IS_E2E_TEST = true;
        const payload = Buffer.from(
            JSON.stringify({
                sub: uid,
                email: claims.email,
                email_verified: true,
                firebase: { sign_in_provider: 'custom' },
            })
        ).toString('base64url');
        expect(
            getContactMethodFromUser(await verifyFirebaseToken(`header.${payload}.signature`))
        ).toEqual({ type: 'email', value: claims.email });
        // Actual Firebase-issued ID token and recovery continuity require staging verification.
    });
    it('sanitizes provider errors without logging or leaking sensitive data', async () => {
        const spies = ['log', 'warn', 'error'].map(method =>
            vi
                .spyOn(console, method as 'log' | 'warn' | 'error')
                .mockImplementation(() => undefined)
        );
        firebase.getUserByEmail.mockRejectedValue(
            new Error(JSON.stringify({ claims, ...exchange }))
        );
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            cause: undefined,
            message: 'School sign-in could not be completed. Please try again.',
        });
        spies.forEach(spy => expect(spy).not.toHaveBeenCalled());
        expect(firebase.createUser).not.toHaveBeenCalled();
    });
});
