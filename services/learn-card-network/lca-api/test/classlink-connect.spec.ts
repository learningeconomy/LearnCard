import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongodb from '@mongo';
import { classlinkRouter } from '../src/routes/classlink';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import { exchangeClassLinkCode, verifyClassLinkIdToken } from '../src/helpers/classlink.helpers';
import { getStateStudentId } from '../src/helpers/classlinkPii.helpers';
import {
    findClassLinkIdentityByIdentityKey,
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import {
    findAuthSubjectByIdentityKey,
    getAuthSubjectsCollection,
    getOrCreateAuthSubject,
} from '../src/models/AuthSubject';
import { Preferences } from '../src/accesslayer/preferences';
import { ThemeEnum } from '../src/types/preferences';
import type { ClassLinkClaims, ClassLinkConfig } from '../src/types/classlink';

const { env, firebase, counts } = vi.hoisted(() => ({
    env: {
        IS_E2E_TEST: false,
        IS_OFFLINE: false,
        CLASSLINK_PII_KEY: Buffer.alloc(32, 7).toString('base64'),
    },
    firebase: {
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        createCustomToken: vi.fn(),
        auth: vi.fn(),
    },
    counts: new Map<string, number>(),
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
    exchangeClassLinkCode: vi.fn(),
    verifyClassLinkIdToken: vi.fn(),
}));
vi.mock('@cache', () => ({
    default: {
        node: {
            eval: async (script: string, _count: number, key: string) => {
                if (script.includes("redis.call('INCR'"))
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                return counts.get(key) ?? null;
            },
        },
    },
}));

const did = 'did:key:existing-account';
const uid = 'existing-firebase-uid';
const identityKey = 'classlink:tenant-test:source-1';
const redirectUri = 'https://app.example/auth/classlink/callback';
const exchange = {
    code: 'private-code',
    codeVerifier: 'v'.repeat(43),
    redirectUri,
    nonce: 'private-nonce',
};
const caller = (callerDid = did) =>
    classlinkRouter.createCaller({
        user: { did: callerDid, isChallengeValid: true },
        clientIp: 'test-ip',
        domain: 'localhost',
        tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
    });
let config: ClassLinkConfig;
let claims: ClassLinkClaims;

beforeEach(async () => {
    vi.clearAllMocks();
    counts.clear();
    const now = Math.floor(Date.now() / 1000);
    config = {
        clientId: 'client-test',
        clientSecret: 'secret-test',
        discoveryUrl: 'https://school.example/discovery',
        redirectUris: [redirectUri],
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
        iat: now,
        exp: now + 300,
        nonce: exchange.nonce,
        classLink_tenant_id: 'tenant-test',
        classLink_sourcedId: 'source-1',
        classLink_role: 'student',
        email: 'student@example.edu',
        email_verified: true,
        api_fields: { student_id: 'private-student-id' },
    };
    vi.mocked(getClassLinkConfig).mockImplementation(() => config);
    vi.mocked(exchangeClassLinkCode).mockResolvedValue({ id_token: 'private-id-token' });
    vi.mocked(verifyClassLinkIdToken).mockImplementation(async () => claims);
    firebase.auth.mockReturnValue(firebase);
    firebase.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
    firebase.createCustomToken.mockImplementation(async (id: string) => `custom-${id}`);
    await Promise.all([
        mongodb.collection('userkeys').deleteMany({}),
        getClassLinkIdentitiesCollection().deleteMany({}),
        getAuthSubjectsCollection().deleteMany({}),
        Preferences.deleteMany({}),
    ]);
    await mongodb.collection('userkeys').insertMany([
        {
            primaryDid: did,
            authProviders: [{ type: 'firebase', id: uid }],
            contactMethod: { type: 'email', value: 'Person@Personal.example' },
        },
        {
            primaryDid: 'did:key:keycloak-only',
            authProviders: [{ type: 'keycloak', id: 'kc-sub' }],
            contactMethod: { type: 'email', value: 'kc@personal.example' },
        },
    ]);
});
afterEach(() => vi.restoreAllMocks());

describe('School Connect', () => {
    it('reports an unconnected account that can connect', async () => {
        await expect(caller().getConnection()).resolves.toEqual({
            available: true,
            canConnect: true,
            connected: false,
            isStudent: false,
        });
        expect(await caller('did:key:keycloak-only').getConnection()).toMatchObject({
            canConnect: false,
        });
    });

    it('connects a school account to the signed-in account and locks student settings', async () => {
        const accountSubject = await getOrCreateAuthSubject('email:person@personal.example', {
            email: 'person@personal.example',
            emailVerified: true,
        });
        await Preferences.insertOne({ did, theme: ThemeEnum.Colorful, aiEnabled: true });

        await expect(caller().connect(exchange)).resolves.toEqual({
            isStudent: true,
            schoolName: 'Example District',
        });

        const identity = await findClassLinkIdentityByIdentityKey(identityKey);
        expect(identity).toMatchObject({ firebaseUid: uid, subject: accountSubject.subject });
        expect(getStateStudentId(identity!)).toBe('private-student-id');
        expect(await findAuthSubjectByIdentityKey(identityKey)).toMatchObject({
            subject: accountSubject.subject,
        });
        expect(await Preferences.findOne({ did })).toMatchObject({
            aiEnabled: false,
            analyticsEnabled: false,
            bugReportsEnabled: false,
            isMinor: true,
        });
        expect(await caller().getConnection()).toMatchObject({
            connected: true,
            isStudent: true,
            schoolName: 'Example District',
        });
        expect(firebase.createUser).not.toHaveBeenCalled();
        expect(firebase.createCustomToken).not.toHaveBeenCalled();
    });

    it('refreshes an existing connection, and a later ClassLink sign-in lands in the same account', async () => {
        await caller().connect(exchange);
        claims.iat += 60;
        claims.api_fields = { student_id: 'updated-student-id' };
        await caller().connect(exchange);
        const identity = await findClassLinkIdentityByIdentityKey(identityKey);
        expect(identity?.lastAuthTime).toEqual(new Date(claims.iat * 1000));
        expect(getStateStudentId(identity!)).toBe('updated-student-id');
        expect(await getClassLinkIdentitiesCollection().countDocuments({})).toBe(1);

        const signIn = classlinkRouter.createCaller({
            clientIp: 'test-ip',
            domain: 'localhost',
            tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
        });
        await expect(signIn.exchangeCode(exchange)).resolves.toEqual({ token: `custom-${uid}` });
        expect(firebase.createUser).not.toHaveBeenCalled();
    });

    it('does not lock staff accounts', async () => {
        claims.classLink_role = 'teacher';
        await expect(caller().connect(exchange)).resolves.toMatchObject({ isStudent: false });
        expect(await Preferences.findOne({ did })).toBeNull();
    });

    it('refuses a school account that belongs to another LearnCard account', async () => {
        await upsertClassLinkIdentity({
            identityKey,
            tenantId: 'tenant-test',
            sourcedId: 'source-1',
            sub: 'private-sub',
            role: 'student',
            email: 'student@example.edu',
            state: 'XX',
            firebaseUid: 'someone-else',
            subject: 'other-subject',
            lastAuthTime: new Date(),
            sealedStateStudentId: null,
        });
        await expect(caller().connect(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'someone-else',
        });
    });

    it('refuses a second, different school account on the same LearnCard account', async () => {
        await caller().connect(exchange);
        claims.classLink_sourcedId = 'source-2';
        await expect(caller().connect(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await getClassLinkIdentitiesCollection().countDocuments({})).toBe(1);
    });

    it('refuses accounts without a supported sign-in and exchanges no code', async () => {
        await expect(caller('did:key:keycloak-only').connect(exchange)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        expect(exchangeClassLinkCode).not.toHaveBeenCalled();
    });

    it('hides internal failures', async () => {
        vi.mocked(exchangeClassLinkCode).mockRejectedValue(new Error('private-provider-error'));
        const error = await caller()
            .connect(exchange)
            .catch((e: unknown) => e);
        expect(error).toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
        expect(JSON.stringify(error)).not.toContain('private-provider-error');
    });
});
