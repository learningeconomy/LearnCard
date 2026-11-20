import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongodb from '@mongo';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import {
    getSchoolNoticeRecipients,
    resolveClassLinkAliasUid,
    resolveOrCreateFirebaseUserByEmail,
} from '../src/helpers/classlinkPrimaryEmail.helpers';
import { createInMemoryAdminAuth } from '../src/helpers/firebaseAdminAuth.helpers';
import { createFirebaseTokenForKeycloakUser } from '../src/helpers/firebase.helpers';
import {
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import {
    getAuthSubjectsCollection,
    getOrCreateAuthSubjectLinkedTo,
} from '../src/models/AuthSubject';
import type { ClassLinkConfig } from '../src/types/classlink';

vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
}));

const did = 'did:key:alias-owner';
const T = 'classlink-t';
const school = 'student@example.edu';
const personal = 'personal@example.com';
const identityKey = 'classlink:tenant-alias:source-1';
const fake = createInMemoryAdminAuth();
const auth = fake.auth;
let config: ClassLinkConfig;

const seedIdentity = (key: string, overrides: Record<string, unknown> = {}) =>
    upsertClassLinkIdentity({
        identityKey: key,
        tenantId: 'tenant-alias',
        sub: 'upstream',
        role: 'student',
        email: school,
        sealedStateStudentId: null,
        state: 'XX',
        firebaseUid: T,
        subject: 'alias-subject',
        primaryDid: did,
        lastAuthTime: new Date(),
        ...overrides,
    });
const promote = (key = identityKey, uid = T) =>
    getClassLinkIdentitiesCollection().updateOne(
        { identityKey: key },
        {
            $set: {
                personalEmail: personal,
                personalEmailVerifiedAt: new Date(),
                primaryEmail: {
                    email: personal,
                    uid,
                    prevFirebaseEmail: school,
                    prevContactMethod: { type: 'email', value: school },
                    state: 'active',
                    at: new Date(),
                },
            },
        }
    );
const setTenant = (overrides: Record<string, unknown>) => {
    config.tenants['tenant-alias'] = { ...config.tenants['tenant-alias']!, ...overrides };
};

beforeEach(async () => {
    fake.reset({ lazyUsers: false });
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getAuthSubjectsCollection().deleteMany({});
    config = {
        clientId: 'test',
        clientSecret: 'test',
        discoveryUrl: 'https://example.edu/discovery',
        redirectUris: [],
        maxAuthAgeSeconds: 86400,
        tenants: {
            'tenant-alias': {
                displayName: 'Alias District',
                state: 'XX',
                stateStudentIdField: '',
                allowedEmailDomains: ['example.edu'],
                transcriptEnabled: false,
            },
        },
        accountContinuity: {
            enabled: true,
            defaultPolicy: { personalEmail: 'all', approval: 'none' },
            tenants: {},
        },
    };
    vi.mocked(getClassLinkConfig).mockImplementation(() => config);
    await mongodb.collection('userkeys').insertOne({
        primaryDid: did,
        authProviders: [{ type: 'firebase', id: T }],
        contactMethod: { type: 'email', value: personal },
    });
    fake.setUser({ uid: T, email: personal, emailVerified: true });
    await seedIdentity(identityKey);
    await promote();
    await getOrCreateAuthSubjectLinkedTo(`email:${school}`, 'alias-subject', {
        email: school,
        emailVerified: true,
    });
});

describe('school-email alias (resolveOrCreateFirebaseUserByEmail)', () => {
    it('the school email reaches T, with lowercasing, and creates no user', async () => {
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, ' Student@Example.EDU ', { allowCreate: true })
        ).resolves.toEqual({ status: 'alias', uid: T });
        expect(fake.peek(T)?.email).toBe(personal);
    });

    it('an existing user for the address wins', async () => {
        fake.setUser({ uid: 'google-user', email: school, emailVerified: true });
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, school, { allowCreate: true })
        ).resolves.toEqual({ status: 'found', uid: 'google-user' });
    });

    it('an unverified holder of the school address never beats the alias', async () => {
        fake.setUser({ uid: 'unverified-holder', email: school, emailVerified: false });
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, school, { allowCreate: true })
        ).resolves.toEqual({ status: 'alias', uid: T });
        // Without a live alias the existing user is still found.
        setTenant({ allowedEmailDomains: [] });
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, school, { allowCreate: true })
        ).resolves.toEqual({ status: 'found', uid: 'unverified-holder' });
    });

    it('an untrusted domain gives no alias', async () => {
        setTenant({ allowedEmailDomains: [] });
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, school, { allowCreate: false })
        ).resolves.toEqual({ status: 'missing' });
        const created = await resolveOrCreateFirebaseUserByEmail(auth, school, {
            allowCreate: true,
        });
        expect(created).toMatchObject({ status: 'created' });
        expect(created).not.toMatchObject({ uid: T });
    });

    it('two identities with the same school email give no alias', async () => {
        await seedIdentity('classlink:tenant-alias:recycled', {
            firebaseUid: 'other-uid',
            subject: 'other-subject',
            primaryDid: 'did:key:other',
        });
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
    });

    it('an idle alias expires (default 365 days; per-district limit; 0 turns it off)', async () => {
        const daysAgo = (days: number) =>
            getClassLinkIdentitiesCollection().updateOne(
                { identityKey },
                { $set: { lastAuthTime: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
            );
        await daysAgo(364);
        expect(await resolveClassLinkAliasUid(school)).toBe(T);
        await daysAgo(366);
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
        setTenant({ schoolEmailAliasMaxIdleDays: 400 });
        expect(await resolveClassLinkAliasUid(school)).toBe(T);
        await daysAgo(1);
        setTenant({ schoolEmailAliasMaxIdleDays: 0 });
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
    });

    it('needs an active promotion on the identity uid and a verified linked subject', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { 'primaryEmail.state': 'pending' } }
        );
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
        await promote();
        await getAuthSubjectsCollection().updateOne(
            { identityKey: `email:${school}` },
            { $set: { subject: 'someone-else' } }
        );
        expect(await resolveClassLinkAliasUid(school)).toBeUndefined();
    });

    it('a moved account returns moved and creates no user', async () => {
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'new-uid' }] } }
            );
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, school, { allowCreate: true })
        ).resolves.toEqual({ status: 'moved' });
        expect(fake.peek('new-uid')).toBeUndefined();
        await expect(auth.getUserByEmail(school)).rejects.toMatchObject({
            code: 'auth/user-not-found',
        });
    });

    it('the orphan guard blocks a stale primaryEmail.uid and finishes the demote', async () => {
        // A rebind removed T from the account, and the demote could not run then.
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'new-uid' }] } }
            );
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, personal, { allowCreate: true })
        ).resolves.toEqual({ status: 'blocked' });
        const demoted = await getClassLinkIdentitiesCollection().findOne({ identityKey });
        expect(demoted?.primaryEmail).toBeUndefined();
        expect(fake.peek(T)?.email).toBe(school);
        expect(
            (await mongodb.collection('userkeys').findOne({ primaryDid: did }))?.contactMethod
        ).toEqual({ type: 'email', value: school });
    });

    it('the orphan guard records demotePending when the demote cannot run', async () => {
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'new-uid' }] } }
            );
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const updateUser = vi
            .spyOn(auth, 'updateUser')
            .mockRejectedValue(Object.assign(new Error('down'), { code: 'auth/internal-error' }));
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, personal, { allowCreate: true })
        ).resolves.toEqual({ status: 'blocked' });
        updateUser.mockRestore();
        expect(
            (await getClassLinkIdentitiesCollection().findOne({ identityKey }))?.demotePending
        ).toMatchObject({ reason: 'orphaned_login' });
        // The owner's personal email still signs in while T holds the account.
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: T }] } }
            );
        await expect(
            resolveOrCreateFirebaseUserByEmail(auth, personal, { allowCreate: true })
        ).resolves.toEqual({ status: 'found', uid: T });
    });
});

describe('school-channel notice recipients (getSchoolNoticeRecipients)', () => {
    const account = { primaryDid: did, linkedDids: [] as string[] };

    it('the school address gets notices while trusted and not idle', async () => {
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([school]);
    });

    it('an untrusted domain gets none', async () => {
        setTenant({ allowedEmailDomains: [] });
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
    });

    it('an idle alias gets none, and 0 turns it off', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { lastAuthTime: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000) } }
        );
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
        setTenant({ schoolEmailAliasMaxIdleDays: 400 });
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([school]);
        setTenant({ schoolEmailAliasMaxIdleDays: 0 });
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
    });

    it('a recycled school address (two identities) or an unlinked subject gets none', async () => {
        await seedIdentity('classlink:tenant-alias:source-2', {
            firebaseUid: 'other-uid',
            subject: 'other-subject',
            primaryDid: 'did:key:other-student',
        });
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
        await getClassLinkIdentitiesCollection().deleteOne({
            identityKey: 'classlink:tenant-alias:source-2',
        });
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([school]);
        await getAuthSubjectsCollection().updateOne(
            { identityKey: `email:${school}` },
            { $set: { subject: 'other-subject' } }
        );
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
    });

    it('only an active promotion counts, and only for this account', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey },
            { $set: { 'primaryEmail.state': 'pending' } }
        );
        await expect(getSchoolNoticeRecipients(account)).resolves.toEqual([]);
        await promote();
        await expect(
            getSchoolNoticeRecipients({ primaryDid: 'did:key:someone-else', linkedDids: [] })
        ).resolves.toEqual([]);
        await expect(getSchoolNoticeRecipients(null)).resolves.toEqual([]);
    });
});

describe('Keycloak bridge: a verified email after an unverified sign-in (LC-2409 review)', () => {
    const sub = 'kc-sub';
    const address = 'scout@example.org';
    const unverifiedThenVerified = async (verifiedEmail: string) => {
        await createFirebaseTokenForKeycloakUser(
            { sub, email: 'unconfirmed@example.org', email_verified: false, name: 'Scout' },
            auth
        );
        expect(fake.peek(sub)).toBeDefined();
        expect(fake.peek(sub)?.email).toBeUndefined();
        return createFirebaseTokenForKeycloakUser(
            { sub, email: verifiedEmail, email_verified: true, name: 'Scout' },
            auth
        );
    };

    it('attaches an unused verified address to the existing subject user', async () => {
        expect(await unverifiedThenVerified('Scout@Example.org')).toBe(`e2e-custom-token-${sub}`);
        expect(fake.peek(sub)).toMatchObject({ email: address, emailVerified: true });
        // Email-code login with the address now resolves to the same user.
        expect(await resolveOrCreateFirebaseUserByEmail(auth, address)).toEqual({
            status: 'found',
            uid: sub,
        });
        // A repeat verified sign-in is stable.
        expect(
            await createFirebaseTokenForKeycloakUser(
                { sub, email: address, email_verified: true },
                auth
            )
        ).toBe(`e2e-custom-token-${sub}`);
    });

    it('a verified address another user holds keeps mapping to that user, unchanged', async () => {
        fake.setUser({ uid: 'holder', email: address, emailVerified: true });
        expect(await unverifiedThenVerified(address)).toBe('e2e-custom-token-holder');
        expect(fake.peek(sub)?.email).toBeUndefined();
        expect(fake.peek('holder')).toMatchObject({ email: address, emailVerified: true });
    });

    it('never replaces an address the subject user already holds', async () => {
        fake.setUser({ uid: sub, email: 'kept@example.org', emailVerified: true });
        expect(
            await createFirebaseTokenForKeycloakUser(
                { sub, email: address, email_verified: true },
                auth
            )
        ).toBe(`e2e-custom-token-${sub}`);
        expect(fake.peek(sub)?.email).toBe('kept@example.org');
        expect(
            await resolveOrCreateFirebaseUserByEmail(auth, address, { allowCreate: false })
        ).toEqual({ status: 'missing' });
    });

    it('an address taken between resolution and the attach resolves to its holder', async () => {
        await createFirebaseTokenForKeycloakUser({ sub, email_verified: false }, auth);
        const spy = vi.spyOn(auth, 'updateUser').mockImplementationOnce(async () => {
            fake.setUser({ uid: 'racer', email: address, emailVerified: true });
            throw Object.assign(new Error('taken'), { code: 'auth/email-already-exists' });
        });
        try {
            expect(
                await createFirebaseTokenForKeycloakUser(
                    { sub, email: address, email_verified: true },
                    auth
                )
            ).toBe('e2e-custom-token-racer');
        } finally {
            spy.mockRestore();
        }
        expect(fake.peek(sub)?.email).toBeUndefined();
    });
});
