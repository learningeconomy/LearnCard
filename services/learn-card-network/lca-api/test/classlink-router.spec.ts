import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    CLASSLINK_ACCOUNT_MOVED_MESSAGE,
    CLASSLINK_ACCOUNT_MOVED_NO_FIREBASE_MESSAGE,
    classlinkRouter,
} from '../src/routes/classlink';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import { exchangeClassLinkCode, verifyClassLinkIdToken } from '../src/helpers/classlink.helpers';
import {
    ClassLinkProviderUnavailable,
    ClassLinkTokenInvalid,
} from '../src/helpers/classlink.errors';
import {
    findClassLinkIdentityByIdentityKey,
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import { getUserKeysCollection, type MongoUserKeyType } from '../src/models/UserKey';
import { getNotStudentCacheKey } from '../src/accesslayer/preferences/privacyLock';
import { syntheticEmailForUid } from '../src/helpers/syntheticEmail.helpers';
import {
    getAuthSubjectsCollection,
    getOrCreateAuthSubject,
    findAuthSubjectByIdentityKey,
} from '../src/models/AuthSubject';
import { getContactMethodFromUser, verifyFirebaseToken } from '../src/helpers/auth.helpers';
import {
    classLinkSubjectDigest,
    classLinkFirebaseUid,
    getStateStudentId,
} from '../src/helpers/classlinkPii.helpers';
import type { ClassLinkClaims, ClassLinkConfig } from '../src/types/classlink';

const { env, firebase, counts, windows, flags, deletedKeys } = vi.hoisted(() => ({
    env: {
        IS_E2E_TEST: false,
        IS_OFFLINE: false,
        CLASSLINK_PII_KEY: Buffer.alloc(32, 7).toString('base64') as string | undefined,
        CLASSLINK_IDENTITY_KEY: undefined as string | undefined,
    },
    firebase: {
        getUserByEmail: vi.fn(),
        getUser: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
        createCustomToken: vi.fn(),
        auth: vi.fn(),
    },
    counts: new Map<string, number>(),
    windows: new Map<string, number>(),
    flags: new Set<string>(),
    deletedKeys: [] as string[],
}));
vi.mock('@environment', () => ({ environment: env }));
vi.mock('../src/firebase', () => ({ default: { auth: firebase.auth } }));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    // Mirrors accountRoute for a did:key caller, whose account DID is its own DID.
    const accountRoute = t.procedure.use(({ ctx, next }) => {
        const { user } = ctx as { user?: { did: string } };
        return next({ ctx: { ...ctx, user: user && { ...user, accountDid: user.did } } });
    });
    return { t, openRoute: t.procedure, didAndChallengeRoute: t.procedure, accountRoute };
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
        delete: async (keys: string[]) => {
            deletedKeys.push(...keys);
            return keys.length;
        },
        node: {
            eval: async (script: string, _count: number, key: string, window: number) => {
                // SET key value EX ttl NX, as used by the retention sweep throttle.
                if (script.includes("'NX'")) {
                    if (flags.has(key)) return null;
                    flags.add(key);
                    return 'OK';
                }
                if (script.includes("redis.call('INCR'"))
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                if (counts.has(key) && !windows.has(key)) windows.set(key, window);
                return counts.get(key) ?? null;
            },
        },
    },
}));

const identityKey = `classlink:tenant-test:v1:${classLinkSubjectDigest('tenant-test', 'source-1')}`;
const uid = classLinkFirebaseUid(identityKey);
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
    flags.clear();
    deletedKeys.length = 0;
    env.IS_E2E_TEST = false;
    env.IS_OFFLINE = false;
    env.CLASSLINK_PII_KEY = Buffer.alloc(32, 7).toString('base64');
    env.CLASSLINK_IDENTITY_KEY = undefined;
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
    const now = Math.floor(Date.now() / 1000);
    claims = {
        iss: 'https://school.example',
        aud: 'client-test',
        sub: 'private-sub',
        iat: now,
        exp: now + 300,
        auth_time: now - 1,
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
    // The Firebase user of a known identity already has an email unless a test says otherwise.
    firebase.getUser.mockImplementation(async (id: string) => ({ uid: id, email: claims.email }));
    firebase.updateUser.mockImplementation(async (id: string) => ({ uid: id }));
    firebase.createCustomToken.mockImplementation(async (id: string) => `custom-${id}`);
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getAuthSubjectsCollection().deleteMany({});
    await getUserKeysCollection().deleteMany({});
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
        expect(firebase.createCustomToken).toHaveBeenLastCalledWith(uid, {
            classlink: true,
            classlinkStudent: true,
        });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            subject: first?.subject,
            firebaseUid: uid,
            lastAuthTime: new Date(claims.iat * 1000),
            stateStudentIdExpiresAt: new Date((claims.iat + config.maxAuthAgeSeconds) * 1000),
            isMinorHint: true,
        });
        const stored = await getClassLinkIdentitiesCollection().findOne({ identityKey });
        expect(stored).not.toHaveProperty('stateStudentId');
        expect(stored).not.toHaveProperty('sourcedId');
        expect(identityKey).not.toContain('source-1');
        expect(stored?.stateStudentIdEnc).toMatch(/^v2:[0-9a-f]{8}:/);
        expect(JSON.stringify(stored)).not.toContain('private-student-id');
        expect(getStateStudentId(stored!)).toBe('private-student-id');
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
    it('drops cached "not a student" answers for an existing account that joins', async () => {
        await getUserKeysCollection().insertOne({
            primaryDid: 'did:key:existing',
            linkedDids: ['did:key:linked'],
            authProviders: [{ type: 'firebase', id: 'existing-user' }],
            contactMethod: { type: 'email', value: 'student@example.edu' },
        } as unknown as MongoUserKeyType);
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        await caller().exchangeCode(exchange);
        expect(deletedKeys).toEqual(
            expect.arrayContaining([
                getNotStudentCacheKey('did:key:existing'),
                getNotStudentCacheKey('did:key:linked'),
            ])
        );
    });
    it('records the joined account DID at sign-in, so a later stale-uid wallet cannot claim it', async () => {
        await getUserKeysCollection().insertOne({
            primaryDid: 'did:key:existing',
            linkedDids: [],
            authProviders: [{ type: 'firebase', id: 'existing-user' }],
        } as unknown as MongoUserKeyType);
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        await caller().exchangeCode(exchange);
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'existing-user',
            primaryDid: 'did:key:existing',
        });
        // A later sign-in (hint unchanged) fills a DID left unset by an older sign-in.
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $unset: { primaryDid: '' } }
        );
        await caller().exchangeCode(exchange);
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            primaryDid: 'did:key:existing',
        });
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
    it.each([true, false])(
        'signs a known identity in to its own account when another Firebase user (verified: %s) holds its school email',
        async emailVerified => {
            // The district is allowlisted only after the student made an email-code account.
            config.tenants['tenant-test']!.allowedEmailDomains = [];
            await caller().exchangeCode(exchange);
            config.tenants['tenant-test']!.allowedEmailDomains = ['example.edu'];
            firebase.getUser.mockResolvedValue({ uid, email: syntheticEmailForUid(uid) });
            firebase.getUserByEmail.mockResolvedValue({ uid: 'email-code-user', emailVerified });
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            await expect(caller().exchangeCode(exchange)).resolves.toEqual({
                token: `custom-${uid}`,
            });
            expect(warn).toHaveBeenCalledExactlyOnceWith('classlink.email.collision', {
                tenantId: 'tenant-test',
            });
            // The school email stays with the other user; no email subject is linked to it.
            expect(firebase.updateUser).not.toHaveBeenCalled();
            expect(await findAuthSubjectByIdentityKey('email:student@example.edu')).toBeNull();
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
                firebaseUid: uid,
            });
        }
    );
    it.each(['missing', 'malformed', 'unverified', 'untrusted-domain'])(
        'signs in with a %s school email using an undeliverable synthetic account address',
        async reason => {
            if (reason === 'missing') delete claims.email;
            if (reason === 'malformed') claims.email = 'not an email';
            if (reason === 'unverified') claims.email_verified = false;
            if (reason === 'untrusted-domain')
                config.tenants['tenant-test']!.allowedEmailDomains = ['other.edu'];
            await expect(caller().exchangeCode(exchange)).resolves.toEqual({
                token: `custom-${uid}`,
            });
            // Wallet key storage needs a contact method, so the Firebase user gets the
            // reserved .invalid address, never marked verified.
            expect(firebase.createUser).toHaveBeenCalledExactlyOnceWith({
                uid,
                displayName: claims.name,
                email: `${uid}@users.classlink.invalid`,
                emailVerified: false,
            });
            expect(syntheticEmailForUid(uid)).toBe(`${uid}@users.classlink.invalid`);
            const subjectRecord = await findAuthSubjectByIdentityKey(identityKey);
            expect(subjectRecord).toMatchObject({ emailVerified: false });
            expect(subjectRecord).not.toHaveProperty('email');
            // No email: subject is created for an untrusted address.
            expect(await findAuthSubjectByIdentityKey('email:student@example.edu')).toBeNull();
            const stored = await findClassLinkIdentityByIdentityKey(identityKey);
            // The identity keeps the real school email (or nothing), never the synthetic one.
            if (reason === 'missing' || reason === 'malformed')
                expect(stored).not.toHaveProperty('email');
            else expect(stored?.email).toBe('student@example.edu');
            expect(JSON.stringify(stored)).not.toContain('classlink.invalid');
        }
    );
    it('backfills the synthetic address on a known identity whose Firebase user has no email', async () => {
        config.tenants['tenant-test']!.allowedEmailDomains = [];
        await caller().exchangeCode(exchange);
        firebase.getUser.mockResolvedValue({ uid, email: undefined });
        await caller().exchangeCode(exchange);
        expect(firebase.createUser).toHaveBeenCalledOnce();
        expect(firebase.updateUser).toHaveBeenCalledExactlyOnceWith(uid, {
            email: `${uid}@users.classlink.invalid`,
            emailVerified: false,
        });
    });
    it('signs in after School Connect moved the identity, releasing the old user email', async () => {
        await caller().exchangeCode(exchange);
        // A recovery rebind plus a School Connect refresh moved the identity to the account's
        // current (phone) Firebase user; the old deterministic user still holds the email.
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { firebaseUid: 'rebound-phone-uid' } }
        );
        firebase.getUserByEmail.mockResolvedValue({ uid, emailVerified: true });
        firebase.getUser.mockImplementation(async (id: string) =>
            id === uid
                ? { uid, email: claims.email }
                : { uid: id, phoneNumber: '+15555550100', email: undefined }
        );
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({
            token: 'custom-rebound-phone-uid',
        });
        expect(warn).not.toHaveBeenCalledWith('classlink.link.conflict', expect.anything());
        // Only the deterministic user is changed, back to its synthetic address.
        expect(firebase.updateUser).toHaveBeenCalledExactlyOnceWith(uid, {
            email: syntheticEmailForUid(uid),
            emailVerified: false,
        });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: 'rebound-phone-uid',
        });
    });
    it('never writes an email onto a non-ClassLink Firebase user linked to the identity', async () => {
        await caller().exchangeCode(exchange);
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { firebaseUid: 'phone-only-uid' } }
        );
        for (const allowed of [[], ['example.edu']]) {
            config.tenants['tenant-test']!.allowedEmailDomains = allowed;
            firebase.getUser.mockImplementation(async (id: string) => ({
                uid: id,
                phoneNumber: '+15555550100',
                email: undefined,
            }));
            await expect(caller().exchangeCode(exchange)).resolves.toEqual({
                token: 'custom-phone-only-uid',
            });
        }
        expect(firebase.updateUser).not.toHaveBeenCalled();
        expect(firebase.createUser).toHaveBeenCalledOnce();
    });
    it('upgrades a synthetic address to the school email once that email becomes trusted', async () => {
        config.tenants['tenant-test']!.allowedEmailDomains = [];
        await caller().exchangeCode(exchange);
        expect(firebase.createUser).toHaveBeenCalledWith(
            expect.objectContaining({ uid, email: syntheticEmailForUid(uid) })
        );
        firebase.getUser.mockResolvedValue({ uid, email: syntheticEmailForUid(uid) });
        // The district later allowlists its domain.
        config.tenants['tenant-test']!.allowedEmailDomains = ['example.edu'];
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({ token: `custom-${uid}` });
        expect(firebase.updateUser).toHaveBeenCalledExactlyOnceWith(uid, {
            email: claims.email,
            emailVerified: true,
        });
        const { subject } = (await findClassLinkIdentityByIdentityKey(identityKey))!;
        expect(await findAuthSubjectByIdentityKey('email:student@example.edu')).toMatchObject({
            subject,
        });
        // A later sign-in finds the upgraded user by email: it is this identity's, not a conflict.
        firebase.getUser.mockResolvedValue({ uid, email: claims.email });
        firebase.getUserByEmail.mockResolvedValue({ uid, emailVerified: true });
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({ token: `custom-${uid}` });
        expect(firebase.updateUser).toHaveBeenCalledOnce();
    });
    it('drops cached "not a student" answers when a fresh identity binds to an existing account', async () => {
        // e.g. the identity was re-created after deleteMyData; the wallet already exists.
        await getUserKeysCollection().insertOne({
            primaryDid: 'did:key:returning',
            linkedDids: [],
            authProviders: [{ type: 'firebase', id: uid }],
            contactMethod: { type: 'email', value: 'student@example.edu' },
        } as unknown as MongoUserKeyType);
        await caller().exchangeCode(exchange);
        expect(deletedKeys).toContain(getNotStudentCacheKey('did:key:returning'));
        deletedKeys.length = 0;
        // A repeat sign-in with an unchanged student hint does no cache work.
        await caller().exchangeCode(exchange);
        expect(deletedKeys).not.toContain(getNotStudentCacheKey('did:key:returning'));
    });
    it.each(['auth/uid-already-exists', 'auth/email-already-exists'])(
        'reuses the deterministic Firebase user when its ClassLink identity row was deleted (%s)',
        async code => {
            // An untrusted email keeps the route from finding the user by email first.
            config.tenants['tenant-test']!.allowedEmailDomains = [];
            await caller().exchangeCode(exchange);
            const subject = (await findClassLinkIdentityByIdentityKey(identityKey))?.subject;
            await getClassLinkIdentitiesCollection().deleteMany({});
            firebase.createUser.mockRejectedValueOnce({ code });
            // The user still holds the address set at first sign-in.
            firebase.getUser.mockResolvedValue({ uid, email: syntheticEmailForUid(uid) });
            await expect(caller().exchangeCode(exchange)).resolves.toEqual({
                token: `custom-${uid}`,
            });
            expect(firebase.createUser).toHaveBeenCalledTimes(2);
            expect(firebase.updateUser).not.toHaveBeenCalled();
            // The AuthSubject survived, so the person keeps the same subject.
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
                firebaseUid: uid,
                subject,
            });
        }
    );
    it('reuses the deterministic user found by its trusted email without trying to create it', async () => {
        await caller().exchangeCode(exchange);
        await getClassLinkIdentitiesCollection().deleteMany({});
        firebase.getUserByEmail.mockResolvedValue({ uid, emailVerified: true });
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({
            token: `custom-${uid}`,
        });
        expect(firebase.createUser).toHaveBeenCalledOnce();
        expect(firebase.getUser).toHaveBeenCalledWith(uid);
        expect(firebase.updateUser).not.toHaveBeenCalled();
    });
    it('rethrows a create failure when the deterministic user does not exist', async () => {
        config.tenants['tenant-test']!.allowedEmailDomains = [];
        firebase.createUser.mockRejectedValueOnce({ code: 'auth/email-already-exists' });
        firebase.getUser.mockRejectedValue({ code: 'auth/user-not-found' });
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
        expect(firebase.createCustomToken).not.toHaveBeenCalled();
    });
    it.each([
        ['a recovery rebind', 'did:key:real'],
        ['"Secure my account" (revoke other devices)', 'did:key:revoked'],
    ])(
        'refuses sign-in when %s unlinked the identity uid from an account that still exists',
        async (_flow, did) => {
            await caller().exchangeCode(exchange);
            // The account recorded on the identity now signs in only with a personal-email user.
            await getUserKeysCollection().insertOne({
                primaryDid: did,
                linkedDids: [],
                authProviders: [{ type: 'firebase', id: 'personal-uid' }],
                contactMethod: { type: 'email', value: 'personal@example.com' },
            } as unknown as MongoUserKeyType);
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey },
                { $set: { primaryDid: did } }
            );
            firebase.getUserByEmail.mockResolvedValue({ uid, emailVerified: true });
            firebase.createCustomToken.mockClear();
            firebase.updateUser.mockClear();
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
                code: 'PRECONDITION_FAILED',
                message: CLASSLINK_ACCOUNT_MOVED_MESSAGE,
            });
            expect(warn).toHaveBeenCalledWith('classlink.identity.account_moved', {
                tenantId: 'tenant-test',
            });
            // No session for the orphaned uid or for the owner's current login.
            expect(firebase.createCustomToken).not.toHaveBeenCalled();
            expect(firebase.updateUser).not.toHaveBeenCalled();
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
                firebaseUid: uid,
                primaryDid: did,
            });
        }
    );
    it('keeps the identity uid while an account still holds it, even with a recorded DID', async () => {
        await getUserKeysCollection().insertOne({
            primaryDid: 'did:key:real',
            linkedDids: [],
            authProviders: [{ type: 'firebase', id: uid }],
            contactMethod: { type: 'email', value: 'student@example.edu' },
        } as unknown as MongoUserKeyType);
        await caller().exchangeCode(exchange);
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { primaryDid: 'did:key:real' } }
        );
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({ token: `custom-${uid}` });
    });
    it('refuses to mint a token for an orphaned uid when the account has no Firebase login', async () => {
        await caller().exchangeCode(exchange);
        await getUserKeysCollection().insertOne({
            primaryDid: 'did:key:real',
            linkedDids: [],
            authProviders: [{ type: 'keycloak', id: 'kc-user' }],
            contactMethod: { type: 'email', value: 'student@example.edu' },
        } as unknown as MongoUserKeyType);
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { primaryDid: 'did:key:real' } }
        );
        firebase.createCustomToken.mockClear();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
            message: CLASSLINK_ACCOUNT_MOVED_NO_FIREBASE_MESSAGE,
        });
        expect(warn).toHaveBeenCalledWith('classlink.identity.account_moved', {
            tenantId: 'tenant-test',
        });
        expect(firebase.createCustomToken).not.toHaveBeenCalled();
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: uid,
        });
    });
    it('recreates the Firebase user when it was deleted but the identity row remains', async () => {
        await caller().exchangeCode(exchange);
        firebase.getUser.mockRejectedValue({ code: 'auth/user-not-found' });
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({
            token: `custom-${uid}`,
        });
        expect(firebase.createUser).toHaveBeenCalledTimes(2);
    });
    it.each(['firebase-uid', 'account'])(
        'refuses to give an existing email account a second ClassLink identity (found by %s)',
        async lookup => {
            firebase.getUserByEmail.mockResolvedValue({
                uid: 'existing-user',
                emailVerified: true,
            });
            const other = {
                identityKey: 'classlink:tenant-test:v1:other-student',
                tenantId: 'tenant-test',
                sub: 'other',
                role: 'student',
                sealedStateStudentId: null,
                state: 'XX',
                subject: 'other-subject',
                lastAuthTime: new Date(),
            };
            if (lookup === 'firebase-uid')
                await upsertClassLinkIdentity({ ...other, firebaseUid: 'existing-user' });
            else {
                // After a recovery rebind the old identity is only linked by its DID.
                await getUserKeysCollection().insertOne({
                    primaryDid: 'did:key:existing',
                    linkedDids: [],
                    authProviders: [{ type: 'firebase', id: 'existing-user' }],
                    contactMethod: { type: 'email', value: 'student@example.edu' },
                } as unknown as MongoUserKeyType);
                await upsertClassLinkIdentity({
                    ...other,
                    firebaseUid: 'pre-rebind-uid',
                    primaryDid: 'did:key:existing',
                });
            }
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
                code: 'CONFLICT',
                message:
                    'This LearnCard account is already connected to a different school account.',
            });
            expect(warn).toHaveBeenCalledWith('classlink.link.conflict', {
                tenantId: 'tenant-test',
                reason: 'other_school',
            });
            expect(await findClassLinkIdentityByIdentityKey(identityKey)).toBeNull();
            expect(firebase.createCustomToken).not.toHaveBeenCalled();
        }
    );
    it('links a trusted verified school email subject so a later email sign-in finds the same person', async () => {
        await caller().exchangeCode(exchange);
        const { subject } = (await findClassLinkIdentityByIdentityKey(identityKey))!;
        expect(await findAuthSubjectByIdentityKey('email:student@example.edu')).toMatchObject({
            subject,
            email: 'student@example.edu',
            emailVerified: true,
        });
    });
    it('never changes an existing email subject that belongs to someone else', async () => {
        await caller().exchangeCode(exchange);
        await getAuthSubjectsCollection().updateOne(
            { identityKey: 'email:student@example.edu' },
            { $set: { subject: 'someone-else' } }
        );
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await caller().exchangeCode(exchange);
        expect(await findAuthSubjectByIdentityKey('email:student@example.edu')).toMatchObject({
            subject: 'someone-else',
        });
        expect(warn).toHaveBeenCalledWith('classlink.email_subject.mismatch', {
            tenantId: 'tenant-test',
        });
    });
    it('gives actionable guidance when the school email already has an account', async () => {
        config.tenants['tenant-test']!.allowedEmailDomains = [];
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'CONFLICT',
            message:
                'You already have a LearnCard account with this email. Sign in the way you usually do, then connect your school account from School Connect.',
        });
    });
    it('logs only the api_fields names a district sends, never values', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
        await caller().exchangeCode(exchange);
        expect(info).toHaveBeenCalledWith('classlink.api_fields', {
            tenantId: 'tenant-test',
            fieldNames: ['student_id'],
        });
        expect(JSON.stringify(info.mock.calls)).not.toContain('private-student-id');
    });
    it('records this sign-in time, not an older ClassLink session auth_time', async () => {
        claims.auth_time = claims.iat - 3 * 86400;
        await caller().exchangeCode(exchange);
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            lastAuthTime: new Date(claims.iat * 1000),
        });
    });
    it('signs in a district without an override using safe defaults', async () => {
        config.tenants = {};
        expect(await caller().exchangeCode(exchange)).toEqual({ token: `custom-${uid}` });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            firebaseUid: uid,
            state: '',
        });
        expect(
            await getClassLinkIdentitiesCollection().findOne({ identityKey })
        ).not.toHaveProperty('stateStudentIdEnc');
    });
    it('never joins an existing email account for a district without an override', async () => {
        config.tenants = {};
        firebase.getUserByEmail.mockResolvedValue({ uid: 'existing-user', emailVerified: true });
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toBeNull();
    });
    it('allows a missing state ID, records iat as the sign-in time, and does not mark staff as minors', async () => {
        delete claims.api_fields;
        delete claims.auth_time;
        claims.classLink_role = 'teacher';
        await caller().exchangeCode(exchange);
        expect(await findClassLinkIdentityByIdentityKey(identityKey)).toMatchObject({
            lastAuthTime: new Date(claims.iat * 1000),
            isMinorHint: false,
        });
    });
    it('clears a stored state ID and legacy plaintext when a sign-in supplies no ID', async () => {
        await caller().exchangeCode(exchange);
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { stateStudentId: 'legacy-plaintext' } }
        );
        delete claims.api_fields;
        await caller().exchangeCode(exchange);
        const stored = await getClassLinkIdentitiesCollection().findOne({ identityKey });
        expect(stored).not.toHaveProperty('stateStudentId');
        expect(stored).not.toHaveProperty('stateStudentIdEnc');
        expect(stored).not.toHaveProperty('stateStudentIdExpiresAt');
    });
    it('signs in without storing a state ID when only the identity key is configured', async () => {
        env.CLASSLINK_IDENTITY_KEY = Buffer.alloc(32, 7).toString('base64');
        env.CLASSLINK_PII_KEY = undefined;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).resolves.toEqual({
            token: `custom-${uid}`,
        });
        expect(
            await getClassLinkIdentitiesCollection().findOne({ identityKey })
        ).not.toHaveProperty('stateStudentIdEnc');
        expect(warn).toHaveBeenCalledWith('classlink.pii.key_missing');
    });
    it('sweeps expired state IDs at most once per interval on sign-in', async () => {
        const expired = {
            identityKey: 'classlink:tenant-test:v1:expired',
            tenantId: 'tenant-test',
            sub: 'other',
            role: 'student',
            state: 'XX',
            firebaseUid: 'other-uid',
            subject: 'other-subject',
            lastAuthTime: new Date(),
            stateStudentIdEnc: 'v2:00000000:expired',
            stateStudentIdExpiresAt: new Date(Date.now() - 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await getClassLinkIdentitiesCollection().insertOne({ ...expired });
        await caller().exchangeCode(exchange);
        expect(
            await getClassLinkIdentitiesCollection().findOne({ identityKey: expired.identityKey })
        ).not.toHaveProperty('stateStudentIdEnc');
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey: expired.identityKey },
            {
                $set: {
                    stateStudentIdEnc: expired.stateStudentIdEnc,
                    stateStudentIdExpiresAt: expired.stateStudentIdExpiresAt,
                },
            }
        );
        await caller().exchangeCode(exchange);
        // Throttled: the second sign-in within the interval does not sweep again.
        expect(
            await getClassLinkIdentitiesCollection().findOne({ identityKey: expired.identityKey })
        ).toHaveProperty('stateStudentIdEnc');
    });
    it('fails closed without any identity key and logs no values', async () => {
        env.CLASSLINK_PII_KEY = undefined;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        const stored = await getClassLinkIdentitiesCollection().findOne({ identityKey });
        expect(stored).toBeNull();
        expect(firebase.createUser).not.toHaveBeenCalled();
        expect(JSON.stringify(stored)).not.toContain('private-student-id');
        expect(warn).toHaveBeenCalledWith('classlink.pii.key_missing');
        expect(JSON.stringify(warn.mock.calls)).not.toContain('private-student-id');
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
    it('limits only abuse-like failures per IP, with a NAT-friendly ceiling', async () => {
        await caller().exchangeCode(exchange);
        expect(counts.size).toBe(0);
        // Refusals and outages are not abuse and never count.
        await getClassLinkIdentitiesCollection().deleteMany({});
        firebase.getUserByEmail.mockResolvedValue({ uid: 'different-user', emailVerified: false });
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({ code: 'CONFLICT' });
        vi.mocked(exchangeClassLinkCode).mockRejectedValueOnce(new ClassLinkProviderUnavailable());
        await expect(caller().exchangeCode(exchange)).rejects.toMatchObject({
            code: 'SERVICE_UNAVAILABLE',
        });
        await expect(
            caller().exchangeCode({ ...exchange, redirectUri: 'https://evil.example/cb' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(counts.size).toBe(0);
        vi.mocked(verifyClassLinkIdToken).mockRejectedValue(new ClassLinkTokenInvalid());
        for (let i = 0; i < 200; i++)
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
        expect(counts.get('classlink:rate:exchange:test-ip')).toBe(200);
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
        // Only a PII-free line (error name/code) is logged, so the failure can be alerted on.
        const [, , error] = spies;
        expect(error).toHaveBeenCalledExactlyOnceWith('classlink.exchange.failed', {
            name: 'Error',
        });
        const output = JSON.stringify(spies.map(spy => spy.mock.calls));
        for (const secret of [
            'private-code',
            'private-nonce',
            'student@example.edu',
            'private-sub',
        ])
            expect(output).not.toContain(secret);
        expect(firebase.createUser).not.toHaveBeenCalled();
    });
});
