import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongodb from '@mongo';
import { classlinkRouter } from '../src/routes/classlink';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import { exchangeClassLinkCode, verifyClassLinkIdToken } from '../src/helpers/classlink.helpers';
import {
    classLinkFirebaseUid,
    classLinkSubjectDigest,
    getStateStudentId,
} from '../src/helpers/classlinkPii.helpers';
import { ClassLinkTokenInvalid } from '../src/helpers/classlink.errors';
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
import { getNotStudentCacheKey } from '../src/accesslayer/preferences/privacyLock';

const { env, firebase, counts, deletedKeys } = vi.hoisted(() => ({
    env: {
        IS_E2E_TEST: false,
        IS_OFFLINE: false,
        CLASSLINK_PII_KEY: Buffer.alloc(32, 7).toString('base64'),
    },
    firebase: {
        getUserByEmail: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        createUser: vi.fn(),
        createCustomToken: vi.fn(),
        auth: vi.fn(),
    },
    counts: new Map<string, number>(),
    deletedKeys: [] as string[],
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
        delete: async (keys: string[]) => {
            deletedKeys.push(...keys);
            return keys.length;
        },
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
const identityKey = `classlink:tenant-test:v1:${classLinkSubjectDigest('tenant-test', 'source-1')}`;
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
    deletedKeys.length = 0;
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
    firebase.getUser.mockImplementation(async (id: string) => ({ uid: id, email: 'x@y.example' }));
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
    it.each([
        { allowed: false, verified: true, trusted: false },
        { allowed: true, verified: undefined, trusted: true },
        { allowed: true, verified: false, trusted: false },
    ])(
        'creates a first sign-in with only trusted email attributes: %j',
        async ({ allowed, verified, trusted }) => {
            config.tenants['tenant-test']!.allowedEmailDomains = allowed ? ['example.edu'] : [];
            claims.email_verified = verified;
            await caller().exchangeCode(exchange);
            const newUid = vi.mocked(firebase.createUser).mock.calls[0]?.[0]?.uid as string;
            expect(firebase.createUser).toHaveBeenCalledWith({
                uid: newUid,
                displayName: undefined,
                ...(trusted
                    ? { email: claims.email, emailVerified: true }
                    : { email: `${newUid}@users.classlink.invalid`, emailVerified: false }),
            });
            const subject = await findAuthSubjectByIdentityKey(identityKey);
            expect(subject?.emailVerified).toBe(trusted);
            expect(subject?.email).toBe(trusted ? claims.email : undefined);
            // Only a trusted verified email gets an email: subject (for the Keycloak cutover).
            const emailSubject = await findAuthSubjectByIdentityKey(`email:${claims.email}`);
            if (trusted) expect(emailSubject?.subject).toBe(subject?.subject);
            else expect(emailSubject).toBeNull();
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
                email: claims.email,
            });
        }
    );

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
        // A cached "not a student" answer for the account must not outlive the connection.
        expect(deletedKeys).toContain(getNotStudentCacheKey(did));
    });

    it('stores the student lock on every DID of the account, not only the caller', async () => {
        const linked = 'did:key:existing-account-linked';
        await mongodb
            .collection('userkeys')
            .updateOne({ primaryDid: did }, { $set: { linkedDids: [linked] } });
        await Preferences.insertOne({ did: linked, theme: ThemeEnum.Formal, aiEnabled: true });

        await expect(caller().connect(exchange)).resolves.toMatchObject({ isStudent: true });

        for (const accountDid of [did, linked])
            expect(await Preferences.findOne({ did: accountDid })).toMatchObject({
                aiEnabled: false,
                analyticsEnabled: false,
                isMinor: true,
                privacyLock: { source: 'classlink' },
            });
        expect(await Preferences.findOne({ did: linked })).toMatchObject({
            theme: ThemeEnum.Formal,
        });
        expect(deletedKeys).toEqual(
            expect.arrayContaining([getNotStudentCacheKey(did), getNotStudentCacheKey(linked)])
        );
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

    it('applies the sign-in trust rule to a district-asserted email', async () => {
        config.tenants['tenant-test']!.allowedEmailDomains = [];
        await caller().connect(exchange);
        const subject = await findAuthSubjectByIdentityKey(identityKey);
        expect(subject?.emailVerified).toBe(false);
        expect(subject).not.toHaveProperty('email');
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            email: 'student@example.edu',
            primaryDid: did,
        });
    });

    it('keeps the connection after a recovery rebind replaces the Firebase provider', async () => {
        await caller().connect(exchange);
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'rebound-uid' }] } }
            );
        expect(await caller().getConnection()).toMatchObject({ connected: true, isStudent: true });
        // Refreshing moves the identity to the account's current Firebase uid.
        await expect(caller().connect(exchange)).resolves.toMatchObject({ isStudent: true });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'rebound-uid',
            primaryDid: did,
        });
    });

    it('gives a fresh wallet made for the owner stale uid no access, and the owner keeps working', async () => {
        await caller().connect(exchange);
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            {
                $set: {
                    personalEmail: 'me@personal.example',
                    personalEmailVerifiedAt: new Date(),
                },
            }
        );
        // Recovery/revoke moved the owner off `uid`; a still-valid session for `uid` then
        // created a fresh wallet through keys.storeAuthShare.
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'rebound-uid' }] } }
            );
        const fresh = 'did:key:fresh-wallet';
        await mongodb.collection('userkeys').insertOne({
            primaryDid: fresh,
            linkedDids: [],
            authProviders: [{ type: 'firebase', id: uid }],
        });
        const owned = { firebaseUid: uid, primaryDid: did, personalEmail: 'me@personal.example' };

        expect(await caller(fresh).getConnection()).toMatchObject({ connected: false });
        await expect(caller(fresh).getPersonalEmail()).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await expect(caller(fresh).connect(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject(owned);
        await expect(caller(fresh).deleteMyData({})).resolves.toEqual({ deleted: 0 });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject(owned);
        expect(await findAuthSubjectByIdentityKey(identityKey)).not.toBeNull();
        // ClassLink sign-in must not treat the fresh wallet as the identity's account.
        firebase.createCustomToken.mockClear();
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        expect(firebase.createCustomToken).not.toHaveBeenCalled();

        // The owner still sees its connection and email, and re-links from School Connect.
        expect(await caller().getConnection()).toMatchObject({ connected: true, isStudent: true });
        expect(await caller().getPersonalEmail()).toEqual({
            email: 'me@personal.example',
            verified: true,
        });
        await expect(caller().connect(exchange)).resolves.toMatchObject({ isStudent: true });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'rebound-uid',
            primaryDid: did,
        });
    });

    it('moving an identity off its ClassLink Firebase user releases the school email, and sign-in still works', async () => {
        const classLinkUid = classLinkFirebaseUid(identityKey);
        // First signed in with ClassLink, then a recovery rebind moved the account to `uid`.
        await upsertClassLinkIdentity({
            identityKey,
            tenantId: 'tenant-test',
            sub: 'private-sub',
            role: 'student',
            email: 'student@example.edu',
            state: 'XX',
            firebaseUid: classLinkUid,
            subject: 'classlink-subject',
            primaryDid: did,
            lastAuthTime: new Date(0),
            sealedStateStudentId: null,
            isMinorHint: true,
        });
        firebase.getUser.mockImplementation(async (id: string) =>
            id === classLinkUid
                ? { uid: id, email: 'student@example.edu' }
                : { uid: id, phoneNumber: '+15555550100', email: undefined }
        );
        firebase.updateUser.mockResolvedValue({});
        await expect(caller().connect(exchange)).resolves.toMatchObject({ isStudent: true });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: uid,
        });
        expect(firebase.updateUser).toHaveBeenCalledExactlyOnceWith(classLinkUid, {
            email: `${classLinkUid}@users.classlink.invalid`,
            emailVerified: false,
        });

        // Even if the old user still resolves for the email (release failed, or an identity
        // moved before this fix), "Sign in with ClassLink" lands on the account, not CONFLICT.
        firebase.updateUser.mockClear();
        firebase.getUserByEmail.mockResolvedValue({ uid: classLinkUid, emailVerified: true });
        const signIn = classlinkRouter.createCaller({
            clientIp: 'test-ip',
            domain: 'localhost',
            tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
        });
        await expect(signIn.exchangeCode(exchange)).resolves.toEqual({ token: `custom-${uid}` });
        // The account's own (phone) Firebase user is never given an email.
        expect(firebase.updateUser).not.toHaveBeenCalledWith(uid, expect.anything());
    });

    it('lets an account without Firebase refresh a connection linked by its DID', async () => {
        await upsertClassLinkIdentity({
            identityKey,
            tenantId: 'tenant-test',
            sub: 'private-sub',
            role: 'student',
            email: 'student@example.edu',
            state: 'XX',
            firebaseUid: 'pre-cutover-uid',
            subject: 'kc-subject',
            primaryDid: 'did:key:keycloak-only',
            lastAuthTime: new Date(0),
            sealedStateStudentId: null,
        });
        expect(await caller('did:key:keycloak-only').getConnection()).toMatchObject({
            canConnect: true,
            connected: true,
        });
        await expect(caller('did:key:keycloak-only').connect(exchange)).resolves.toMatchObject({
            isStudent: true,
        });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'pre-cutover-uid',
            lastAuthTime: new Date(claims.iat * 1000),
        });
    });

    it('counts only invalid tokens toward the per-account limit', async () => {
        await upsertClassLinkIdentity({
            identityKey,
            tenantId: 'tenant-test',
            sub: 'private-sub',
            role: 'student',
            state: 'XX',
            firebaseUid: 'someone-else',
            subject: 'other-subject',
            lastAuthTime: new Date(),
            sealedStateStudentId: null,
        });
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(caller().connect(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(counts.size).toBe(0);
        vi.mocked(verifyClassLinkIdToken).mockRejectedValueOnce(new ClassLinkTokenInvalid());
        await expect(caller().connect(exchange)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect([...counts.values()]).toEqual([1]);
    });
});
