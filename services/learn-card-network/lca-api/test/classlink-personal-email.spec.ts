import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mongodb from '@mongo';
import cache from '@cache';
import { t } from '@routes';
import { personalEmailProcedures } from '../src/routes/classlinkPersonalEmail';
import { getClassLinkConfig } from '../src/helpers/classlink.config';
import {
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import {
    getAuthSubjectsCollection,
    getOrCreateAuthSubject,
    getOrCreateAuthSubjectLinkedTo,
    findAuthSubjectByIdentityKey,
} from '../src/models/AuthSubject';
import { deleteClassLinkDataForAccount } from '../src/helpers/classlinkDeletion.helpers';
import {
    recordEmailCodeSignIn,
    recordFirebaseSignIn,
} from '../src/helpers/classlinkPrimaryEmail.helpers';
import { getCurrentProfile } from '../src/helpers/currentProfile';
import { updateClassLinkIdentity } from '../src/models/ClassLinkIdentity';
import { e2eAdminAuth } from '../src/helpers/firebaseAdminAuth.helpers';
import { isEscrowEnabled, isEscrowRemoteMode } from '../src/services/escrow-enclave';
import { contactDigest } from '../src/helpers/escrowContactDigest';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../src/services/delivery', () => ({
    getDeliveryService: () => ({ send }),
    getFrom: () => 'login@example.com',
}));
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
}));
vi.mock('../src/helpers/currentProfile', () => ({ getCurrentProfile: vi.fn() }));
vi.mock('../src/services/escrow-enclave', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/services/escrow-enclave')>()),
    isEscrowEnabled: vi.fn(() => true),
    isEscrowRemoteMode: vi.fn(() => false),
}));
vi.mock('../src/models/ClassLinkIdentity', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/models/ClassLinkIdentity')>();
    return { ...actual, updateClassLinkIdentity: vi.fn(actual.updateClassLinkIdentity) };
});
vi.mock('../src/models/AuthSubject', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/models/AuthSubject')>();
    return {
        ...actual,
        getOrCreateAuthSubjectLinkedTo: vi.fn(actual.getOrCreateAuthSubjectLinkedTo),
    };
});
vi.mock('@cache', async () => {
    const { default: Redis } = await import('ioredis-mock');
    const node = new Redis();
    return {
        default: {
            node,
            get: (key: string) => node.get(key),
            set: (key: string, value: string, ttl: number) => node.set(key, value, 'EX', ttl),
        },
    };
});
const router = t.router(personalEmailProcedures);
const did = 'did:key:personal-email-test';
const branding = { brandName: 'Example School' };
const caller = () =>
    router.createCaller({
        user: { did, isChallengeValid: true },
        domain: 'api.example',
        tenant: { id: 'learncard', resolvedVia: 'default', emailBranding: branding },
    });
const email = 'personal@example.com';
// Codes are keyed by a hash of the identity key, which survives Firebase provider changes.
const key = `classlink-personal-email:${createHash('sha256')
    .update('classlink:tenant-test:source-1')
    .digest('hex')}`;
const getCode = () =>
    String(
        send.mock.calls
            .filter(([message]) => message.templateAlias === 'login-verification-code')
            .at(-1)?.[0].templateModel.verificationCode
    );
/** Who got the sign-in email notice (`sign-in-email-changed`), in send order. */
const noticeRecipients = () =>
    send.mock.calls
        .filter(([message]) => message.templateAlias === 'sign-in-email-changed')
        .map(([message]) => message.to);
const school = 'student@example.edu';
/** What verify returns when it promotes the address on T (`uid-test`). */
const promoted = {
    success: true,
    verified: true,
    primary: true,
    primaryUid: 'uid-test',
    customToken: 'e2e-custom-token-uid-test',
};

beforeEach(async () => {
    send.mockReset().mockResolvedValue(undefined);
    await cache.node.flushall();
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getAuthSubjectsCollection().deleteMany({});
    await mongodb.collection('userkeys').insertOne({
        primaryDid: did,
        authProviders: [{ type: 'firebase', id: 'uid-test' }],
        contactMethod: { type: 'email', value: school },
        shareVersion: 1,
    });
    // T (`uid-test`) signs in with the trusted school email.
    e2eAdminAuth.reset();
    e2eAdminAuth.setUser({ uid: 'uid-test', email: school, emailVerified: true });
    vi.mocked(isEscrowEnabled).mockReturnValue(true);
    vi.mocked(isEscrowRemoteMode).mockReturnValue(false);
    await upsertClassLinkIdentity({
        identityKey: 'classlink:tenant-test:source-1',
        tenantId: 'tenant-test',
        sub: 'upstream',
        role: 'student',
        email: 'student@example.edu',
        sealedStateStudentId: null,
        state: 'XX',
        firebaseUid: 'uid-test',
        subject: 'same-subject',
        lastAuthTime: new Date(),
    });
    vi.mocked(getClassLinkConfig).mockReturnValue({
        clientId: 'test',
        clientSecret: 'test',
        discoveryUrl: 'https://example.edu/discovery',
        redirectUris: [],
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
        accountContinuity: {
            enabled: true,
            defaultPolicy: { personalEmail: 'nonStudents', approval: 'none' },
            tenants: {},
        },
    });
    vi.mocked(getCurrentProfile).mockReset().mockResolvedValue(null);
});

/** Replace the account-continuity layers for one test. */
const setContinuity = (
    continuity: Partial<NonNullable<ReturnType<typeof getClassLinkConfig>>['accountContinuity']>
) => {
    const config = getClassLinkConfig()!;
    vi.mocked(getClassLinkConfig).mockReturnValue({
        ...config,
        accountContinuity: { ...config.accountContinuity, ...continuity },
    });
};
const makeStudent = () =>
    getClassLinkIdentitiesCollection().updateOne(
        { firebaseUid: 'uid-test' },
        { $set: { isMinorHint: true } }
    );
/** The stable reason code on a FORBIDDEN refusal. */
const reasonOf = async (promise: Promise<unknown>): Promise<unknown> => {
    const error = await promise.then(
        () => undefined,
        (rejection: unknown) => rejection
    );
    expect(error).toMatchObject({ code: 'FORBIDDEN' });
    return (error as { cause?: { reason?: unknown } }).cause?.reason;
};
const userKey = () => mongodb.collection('userkeys').findOne({ primaryDid: did });

describe('ClassLink personal email', () => {
    it('rejects normalized school emails without writing or sending', async () => {
        await expect(
            caller().startPersonalEmail({ email: ' Student@EXAMPLE.EDU ' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(await cache.get(key)).toBeNull();
        expect(send).not.toHaveBeenCalled();
    });
    it('rejects the ClassLink email domain for a district without an override', async () => {
        vi.mocked(getClassLinkConfig).mockReturnValue({
            ...getClassLinkConfig()!,
            tenants: {},
        });
        await expect(
            caller().startPersonalEmail({ email: 'other@example.edu' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(send).not.toHaveBeenCalled();
    });
    it('does not reveal a taken address until the code is proven, and never changes it', async () => {
        const other = await getOrCreateAuthSubject(`email:${email}`, {
            email,
            emailVerified: false,
        });
        // start answers exactly as for a free address (the code goes to the address owner).
        await expect(caller().startPersonalEmail({ email })).resolves.toEqual({ success: true });
        await expect(caller().verifyPersonalEmail({ email, code: '000000' })).rejects.toMatchObject(
            { code: 'BAD_REQUEST' }
        );
        await expect(
            caller().verifyPersonalEmail({ email, code: getCode() })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toEqual(other);
        expect(await caller().getPersonalEmail()).toEqual({ verified: false });
    });
    it('rate-limits address checks per DID so accounts cannot be probed', async () => {
        for (let i = 0; i < 20; i++)
            await expect(
                caller().verifyPersonalEmail({ email: `probe${i}@example.com`, code: '000000' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            caller().verifyPersonalEmail({ email: 'probe-final@example.com', code: '000000' })
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });
    it('rejects a synthetic ClassLink account address', async () => {
        await expect(
            caller().startPersonalEmail({ email: 'classlink_x@users.classlink.invalid' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(send).not.toHaveBeenCalled();
    });
    it('uid not on account refuses (the identity is still found by DID after a rebind)', async () => {
        await getClassLinkIdentitiesCollection().updateOne(
            { firebaseUid: 'uid-test' },
            { $set: { primaryDid: did } }
        );
        await mongodb
            .collection('userkeys')
            .updateOne(
                { primaryDid: did },
                { $set: { authProviders: [{ type: 'firebase', id: 'new-uid' }] } }
            );
        await expect(caller().startPersonalEmail({ email })).resolves.toEqual({ success: true });
        expect(await caller().getPersonalEmail()).toEqual({ verified: false });
        // The identity is still found by DID, but its uid no longer opens the account.
        const error = await caller()
            .verifyPersonalEmail({ email, code: getCode() })
            .catch((rejection: unknown) => rejection);
        expect(error).toMatchObject({ code: 'PRECONDITION_FAILED' });
        expect((error as { cause?: { reason?: string } }).cause?.reason).toBe('account_moved');
        expect(e2eAdminAuth.peek('uid-test')?.email).toBe(school);
    });
    it('invalidates on the fifth incorrect attempt', async () => {
        await caller().startPersonalEmail({ email });
        for (let i = 0; i < 5; i++) {
            await expect(
                caller().verifyPersonalEmail({ email, code: '000000' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(Boolean(await cache.get(key))).toBe(i < 4);
        }
        await expect(
            caller().verifyPersonalEmail({ email, code: getCode() })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
    it('links the verified normalized email to the same subject and consumes the code once', async () => {
        await caller().startPersonalEmail({ email: ' Personal@EXAMPLE.COM ' });
        expect(await cache.node.ttl(key)).toBeGreaterThan(295);
        expect(await cache.node.ttl(key)).toBeLessThanOrEqual(300);
        const code = getCode();
        expect(await caller().verifyPersonalEmail({ email, code })).toEqual(promoted);
        expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
        expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
            subject: 'same-subject',
            emailVerified: true,
        });
        expect(
            (await getClassLinkIdentitiesCollection().findOne({ firebaseUid: 'uid-test' }))
                ?.personalEmailVerifiedAt
        ).toBeInstanceOf(Date);
        await expect(caller().verifyPersonalEmail({ email, code })).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });
    it('checks conflicts again after code delivery', async () => {
        await caller().startPersonalEmail({ email });
        const other = await getOrCreateAuthSubject(`email:${email}`, { emailVerified: false });
        await expect(
            caller().verifyPersonalEmail({ email, code: getCode() })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toEqual(other);
        expect(await caller().getPersonalEmail()).toEqual({ verified: false });
    });
    it('limits sends per account across different email addresses', async () => {
        for (let i = 0; i < 3; i++)
            await caller().startPersonalEmail({ email: `personal${i}@example.com` });
        await expect(caller().startPersonalEmail({ email })).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        expect(send).toHaveBeenCalledTimes(3);
    });
    it('delivers with tenant branding and the existing local template', async () => {
        await caller().startPersonalEmail({ email });
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({
                to: email,
                branding,
                templateAlias: 'login-verification-code',
                from: 'login@example.com',
            })
        );
    });
    it('requires ClassLink ownership and a live challenge', async () => {
        await expect(
            router
                .createCaller({
                    user: { did, isChallengeValid: false },
                    domain: 'api.example',
                    tenant: { id: 'learncard', resolvedVia: 'default', emailBranding: branding },
                })
                .getPersonalEmail()
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await getClassLinkIdentitiesCollection().deleteMany({});
        await expect(caller().getPersonalEmail()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
    it('parallel guesses cannot exceed the limit', async () => {
        await caller().startPersonalEmail({ email });
        const results = await Promise.allSettled(
            Array.from({ length: 12 }, () =>
                caller().verifyPersonalEmail({ email, code: '000000' })
            )
        );
        // Each guess is either refused by the per-account change lock (never compared) or
        // counted before comparing, so at most the limit are ever checked.
        const codes = results.map(result =>
            result.status === 'rejected' ? (result.reason as { code?: string }).code : 'ok'
        );
        expect(codes.every(code => code === 'BAD_REQUEST' || code === 'PRECONDITION_FAILED')).toBe(
            true
        );
        expect(codes.filter(code => code === 'BAD_REQUEST').length).toBeLessThanOrEqual(5);
        for (let guess = 0; guess < 5; guess += 1)
            await caller()
                .verifyPersonalEmail({ email, code: '000000' })
                .catch(() => undefined);
        expect(await cache.get(key)).toBeNull();
        await expect(
            caller().verifyPersonalEmail({ email, code: getCode() })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
    it('enforces the send budget for parallel requests', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: 8 }, (_, i) =>
                caller().startPersonalEmail({ email: `parallel${i}@example.com` })
            )
        );
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(3);
        expect(send).toHaveBeenCalledTimes(3);
    });
    it('resets the attempt limit when a new code is issued', async () => {
        await caller().startPersonalEmail({ email });
        for (let i = 0; i < 4; i++)
            await expect(
                caller().verifyPersonalEmail({ email, code: '000000' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await caller().startPersonalEmail({ email });
        for (let i = 0; i < 4; i++)
            await expect(
                caller().verifyPersonalEmail({ email, code: '000000' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(caller().verifyPersonalEmail({ email, code: getCode() })).resolves.toEqual(
            promoted
        );
    });
    describe('account continuity policy', () => {
        it('refuses everyone while the master switch is off, without sending', async () => {
            setContinuity({ enabled: false });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe('disabled');
            expect(await reasonOf(caller().verifyPersonalEmail({ email, code: '123456' }))).toBe(
                'disabled'
            );
            expect(send).not.toHaveBeenCalled();
        });

        it('refuses a district that turned personal email off', async () => {
            setContinuity({ tenants: { 'tenant-test': { personalEmail: 'off' } } });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe('district_off');
        });

        it('refuses students under nonStudents and allows them under all', async () => {
            await makeStudent();
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe(
                'students_excluded'
            );
            expect(await reasonOf(caller().verifyPersonalEmail({ email, code: '123456' }))).toBe(
                'students_excluded'
            );
            expect(send).not.toHaveBeenCalled();

            setContinuity({ tenants: { 'tenant-test': { personalEmail: 'all' } } });
            await caller().startPersonalEmail({ email });
            await expect(
                caller().verifyPersonalEmail({ email, code: getCode() })
            ).resolves.toMatchObject({ success: true });
            expect(getCurrentProfile).not.toHaveBeenCalled();
        });

        it('checks a student minimum age against the profile date of birth', async () => {
            await makeStudent();
            setContinuity({
                defaultPolicy: { personalEmail: 'all', minimumAge: 13, approval: 'none' },
            });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe('age_unknown');
            vi.mocked(getCurrentProfile).mockResolvedValue({ dob: null });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe('age_unknown');
            const tenYearsAgo = new Date();
            tenYearsAgo.setUTCFullYear(tenYearsAgo.getUTCFullYear() - 10);
            vi.mocked(getCurrentProfile).mockResolvedValue({
                dob: tenYearsAgo.toISOString().slice(0, 10),
            });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe(
                'below_minimum_age'
            );
            vi.mocked(getCurrentProfile).mockResolvedValue({ dob: '2000-01-01' });
            await expect(caller().startPersonalEmail({ email })).resolves.toEqual({
                success: true,
            });
        });

        it('fails closed on guardian approval until it exists', async () => {
            await makeStudent();
            setContinuity({ defaultPolicy: { personalEmail: 'all', approval: 'guardian' } });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe(
                'approval_required'
            );
        });

        it('applies the most restrictive district when the person has several', async () => {
            await upsertClassLinkIdentity({
                identityKey: 'classlink:tenant-closed:source-2',
                tenantId: 'tenant-closed',
                sub: 'upstream-2',
                role: 'student',
                email: 'student@closed.example.edu',
                sealedStateStudentId: null,
                state: 'XX',
                firebaseUid: 'uid-test',
                subject: 'other-subject',
                lastAuthTime: new Date(),
            });
            setContinuity({ tenants: { 'tenant-closed': { personalEmail: 'off' } } });
            expect(await reasonOf(caller().startPersonalEmail({ email }))).toBe('district_off');
        });
    });

    describe('sign-in email (promotion)', () => {
        const verify = async (address: string) => {
            await caller().startPersonalEmail({ email: address });
            return caller().verifyPersonalEmail({ email: address, code: getCode() });
        };
        const identity = () =>
            getClassLinkIdentitiesCollection().findOne({ firebaseUid: 'uid-test' });
        const firebaseEmail = (uid = 'uid-test') => e2eAdminAuth.peek(uid)?.email;
        const lockKey = `classlink:lock:personal-email:${createHash('sha256')
            .update(did)
            .digest('hex')}`;
        const errorOf = (promise: Promise<unknown>) =>
            promise.then(
                () => undefined,
                (rejection: unknown) => rejection as { code?: string; cause?: { reason?: string } }
            );
        const makePlaceholder = async () => {
            const synthetic = 'uid-test@users.classlink.invalid';
            e2eAdminAuth.setUser({ uid: 'uid-test', email: synthetic });
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { contactMethod: { type: 'email', value: synthetic } } }
                );
            return synthetic;
        };
        const enrollEscrow = () =>
            mongodb.collection('userkeys').updateOne(
                { primaryDid: did },
                {
                    $set: {
                        escrowBlob: { shareVersion: 1, blobHash: 'test-blob' },
                        recoveryMethods: [
                            {
                                type: 'escrow',
                                createdAt: new Date(),
                                confirmedAt: new Date(),
                                shareVersion: 1,
                            },
                        ],
                    },
                }
            );

        it('verify promotes Firebase email and contact method, returns a customToken for T', async () => {
            expect(await verify(email)).toEqual(promoted);
            expect(e2eAdminAuth.peek('uid-test')).toMatchObject({ email, emailVerified: true });
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: email });
            expect((await identity())?.primaryEmail).toMatchObject({
                state: 'active',
                email,
                uid: 'uid-test',
                prevFirebaseEmail: school,
                prevContactMethod: { type: 'email', value: school },
            });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                subject: 'same-subject',
            });
        });

        it('verify writes the pending marker before Firebase; a crash after promote is reconciled', async () => {
            const original = e2eAdminAuth.auth.updateUser;
            let stateAtWrite: string | undefined;
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockImplementationOnce(async (...args) => {
                stateAtWrite = (await identity())?.primaryEmail?.state;
                return original(...args);
            });
            vi.mocked(updateClassLinkIdentity).mockRejectedValueOnce(new Error('crash'));
            await expect(verify(email)).rejects.toThrow();
            expect(stateAtWrite).toBe('pending');
            expect(firebaseEmail()).toBe(email);
            expect((await identity())?.primaryEmail?.state).toBe('pending');
            // T holds the address, so the reservation stays, tracked on the pending record.
            const reserved = await findAuthSubjectByIdentityKey(`email:${email}`);
            expect(reserved?.reservedBy).toBeTruthy();
            expect((await identity())?.primaryEmail?.reservedBy).toBe(reserved?.reservedBy);
            // Remove (or the reconcile) still sees the pending record.
            await getClassLinkIdentitiesCollection().updateOne(
                { firebaseUid: 'uid-test' },
                { $set: { 'primaryEmail.at': new Date(Date.now() - 11 * 60 * 1000) } }
            );
            // The query only reports it; it never changes T's email.
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                nextStep: 'email',
                reconcilePending: true,
            });
            expect(firebaseEmail()).toBe(email);
            expect(await caller().reconcilePersonalEmail()).toEqual({
                changed: true,
                customToken: 'e2e-custom-token-uid-test',
            });
            expect(await caller().reconcilePersonalEmail()).toEqual({ changed: false });
            expect((await caller().getAccountContinuity()).reconcilePending).toBe(false);
            // The reservation went with the pending record.
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            expect(firebaseEmail()).toBe(school);
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            expect((await identity())?.primaryEmail).toBeUndefined();
        });

        it('verify is idempotent on retry after a partial write', async () => {
            vi.mocked(updateClassLinkIdentity).mockRejectedValueOnce(new Error('injected'));
            await expect(verify(email)).rejects.toThrow();
            expect(await caller().getPersonalEmail()).toEqual({ verified: false });
            // The first attempt changed T's email (revoking its sessions) and then failed: the
            // retry still returns T's token so this device can sign back in.
            expect(firebaseEmail()).toBe(email);
            expect(await verify(email)).toEqual(promoted);
            expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
            expect((await identity())?.primaryEmail).toMatchObject({
                state: 'active',
                prevFirebaseEmail: school,
            });
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: email });
        });

        it('CONFLICT from another user rolls back the AuthSubject and pending marker', async () => {
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(
                Object.assign(new Error('taken'), { code: 'auth/email-already-exists' })
            );
            expect(await errorOf(verify(email))).toMatchObject({ code: 'CONFLICT' });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            expect((await identity())?.primaryEmail).toBeUndefined();
            expect(firebaseEmail()).toBe(school);
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
        });

        it('contact CAS failure rolls back the Firebase email', async () => {
            const original = e2eAdminAuth.auth.updateUser;
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockImplementationOnce(async (...args) => {
                await mongodb
                    .collection('userkeys')
                    .updateOne(
                        { primaryDid: did },
                        { $set: { contactMethod: { type: 'email', value: 'moved@example.org' } } }
                    );
                return original(...args);
            });
            expect(await errorOf(verify(email))).toMatchObject({ code: 'CONFLICT' });
            expect(firebaseEmail()).toBe(school);
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            expect((await identity())?.primaryEmail).toBeUndefined();
            expect((await userKey())?.contactMethod).toEqual({
                type: 'email',
                value: 'moved@example.org',
            });
        });

        it("another UserKey's contact gives CONFLICT", async () => {
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:sibling',
                authProviders: [{ type: 'firebase', id: 'sibling' }],
                contactMethod: { type: 'email', value: email },
            });
            expect(await errorOf(verify(email))).toMatchObject({ code: 'CONFLICT' });
            expect(firebaseEmail()).toBe(school);
            expect((await identity())?.primaryEmail).toBeUndefined();
        });

        it('address held by another uid of the same account is own-email', async () => {
            await mongodb.collection('userkeys').updateOne(
                { primaryDid: did },
                {
                    $set: {
                        authProviders: [
                            { type: 'firebase', id: 'uid-test' },
                            { type: 'firebase', id: 'uid-two' },
                        ],
                    },
                }
            );
            e2eAdminAuth.setUser({ uid: 'uid-two', email });
            expect(await verify(email)).toEqual({ success: true, verified: true, primary: false });
            expect(firebaseEmail()).toBe(school);
            expect((await identity())?.primaryEmail).toBeUndefined();
            expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
            // The account already signs in with it: continuity does not ask for the email again.
            await mongodb.collection('userkeys').updateOne(
                { primaryDid: did },
                {
                    $set: {
                        recoveryMethods: [
                            { type: 'passkey', createdAt: new Date(), confirmedAt: new Date() },
                        ],
                    },
                }
            );
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                signInEmailSource: 'account',
                primaryUid: 'uid-test',
                nextStep: 'done',
            });
        });

        it('stray empty Firebase user is reclaimed; a user with a UserKey is not', async () => {
            e2eAdminAuth.setUser({ uid: 'stray', email });
            expect(await verify(email)).toEqual(promoted);
            expect(e2eAdminAuth.peek('stray')).toBeUndefined();
            expect(firebaseEmail()).toBe(email);

            const other = 'other@example.com';
            e2eAdminAuth.setUser({ uid: 'owned', email: other });
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:owned',
                authProviders: [{ type: 'firebase', id: 'owned' }],
                contactMethod: { type: 'phone', value: '+15555550100' },
            });
            expect(await errorOf(verify(other))).toMatchObject({ code: 'CONFLICT' });
            expect(e2eAdminAuth.peek('owned')?.email).toBe(other);
            expect(firebaseEmail()).toBe(email);
        });

        it('verify clears an equal recovery email and never sets one', async () => {
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { recoveryEmail: email, recoveryEmailVerifiedAt: new Date() } }
                );
            await verify(email);
            expect(await userKey()).not.toHaveProperty('recoveryEmail');
            expect(await userKey()).not.toHaveProperty('recoveryEmailVerifiedAt');
            // A different recovery email the user chose is kept.
            await mongodb.collection('userkeys').updateOne(
                { primaryDid: did },
                {
                    $set: {
                        recoveryEmail: 'chosen@example.com',
                        recoveryEmailVerifiedAt: new Date(),
                    },
                }
            );
            await verify('second@example.com');
            expect((await userKey())?.recoveryEmail).toBe('chosen@example.com');
        });

        it('own real Firebase email links alias only', async () => {
            e2eAdminAuth.setUser({
                uid: 'uid-test',
                email: 'own@example.org',
                emailVerified: true,
            });
            expect(await verify(email)).toEqual({ success: true, verified: true, primary: false });
            expect(firebaseEmail()).toBe('own@example.org');
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                subject: 'same-subject',
            });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                signInEmailSource: 'account',
                primaryUid: 'uid-test',
            });
        });

        it('phone-only T restores the phone contact on remove (its Firebase email becomes the synthetic address)', async () => {
            const phone = { type: 'phone', value: '+15555550123' };
            e2eAdminAuth.setUser({ uid: 'uid-test', phoneNumber: phone.value });
            await mongodb
                .collection('userkeys')
                .updateOne({ primaryDid: did }, { $set: { contactMethod: phone } });
            expect(await verify(email)).toEqual(promoted);
            expect((await identity())?.primaryEmail).toMatchObject({
                prevFirebaseEmail: null,
                prevContactMethod: phone,
            });
            expect(await caller().removePersonalEmail()).toEqual({
                success: true,
                removed: true,
                customToken: 'e2e-custom-token-uid-test',
            });
            // Firebase Admin cannot remove an email, so T gets the reserved undeliverable one.
            expect(e2eAdminAuth.peek('uid-test')).toMatchObject({
                email: 'uid-test@users.classlink.invalid',
                emailVerified: false,
                phoneNumber: phone.value,
            });
            expect((await userKey())?.contactMethod).toEqual(phone);
        });

        it('an expired lock aborts before the next write', async () => {
            vi.mocked(getOrCreateAuthSubjectLinkedTo).mockImplementationOnce(async (...args) => {
                await cache.node.del(lockKey);
                const actual = await vi.importActual<typeof import('../src/models/AuthSubject')>(
                    '../src/models/AuthSubject'
                );
                return actual.getOrCreateAuthSubjectLinkedTo(...args);
            });
            expect(await errorOf(verify(email))).toMatchObject({ code: 'PRECONDITION_FAILED' });
            expect(firebaseEmail()).toBe(school);
            expect((await identity())?.primaryEmail).toBeUndefined();
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            // The reservation this call made is released, so the address is not left blocked.
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            // The retry converges.
            expect(await verify(email)).toEqual(promoted);
        });

        describe('reservation and lost races (LC-2409 review)', () => {
            const internalError = () =>
                Object.assign(new Error('unavailable'), { code: 'auth/internal-error' });

            it('a Firebase failure before the change releases the reservation, keeping the pending record', async () => {
                vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(internalError());
                await expect(verify(email)).rejects.toThrow();
                expect(firebaseEmail()).toBe(school);
                // Another account can use the address; the pending record waits for a retry.
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
                expect((await identity())?.primaryEmail?.state).toBe('pending');
                expect(await verify(email)).toEqual(promoted);
                const linked = await findAuthSubjectByIdentityKey(`email:${email}`);
                expect(linked).toMatchObject({ subject: 'same-subject' });
                // Committed: the reservation token is gone, and so is the record's.
                expect(linked?.reservedBy).toBeUndefined();
                expect((await identity())?.primaryEmail?.reservedBy).toBeUndefined();
            });

            it('an alias-only verify that fails releases its reservation', async () => {
                e2eAdminAuth.setUser({ uid: 'uid-test', email: 'own@example.org' });
                vi.mocked(updateClassLinkIdentity).mockRejectedValueOnce(new Error('mongo down'));
                await expect(verify(email)).rejects.toThrow('mongo down');
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            });

            it('never releases a subject this call did not insert', async () => {
                // The student already signs in with the address elsewhere (e.g. Keycloak).
                await getOrCreateAuthSubjectLinkedTo(`email:${email}`, 'same-subject', {
                    email,
                    emailVerified: true,
                });
                vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(internalError());
                await expect(verify(email)).rejects.toThrow();
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                    subject: 'same-subject',
                });
            });

            it("a lock lost during the Firebase call stops the change and leaves the new holder's record", async () => {
                const original = e2eAdminAuth.auth.updateUser;
                const theirs = new Date(Date.now() + 1000);
                vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockImplementationOnce(
                    async (...args) => {
                        // The lock expires while Firebase is slow; another change takes it and
                        // writes its own pending record before this write lands.
                        await cache.node.set(lockKey, 'another-holder');
                        await getClassLinkIdentitiesCollection().updateOne(
                            { firebaseUid: 'uid-test' },
                            { $set: { 'primaryEmail.at': theirs } }
                        );
                        return original(...args);
                    }
                );
                expect(await errorOf(verify(email))).toMatchObject({
                    code: 'PRECONDITION_FAILED',
                    cause: { reason: 'busy' },
                });
                const stored = await identity();
                expect(stored?.personalEmail).toBeUndefined();
                expect(stored?.primaryEmail).toMatchObject({ state: 'pending', at: theirs });
                expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            });

            it('the completion write is a compare-and-set: a stale write after a takeover does not land', async () => {
                const actual = await vi.importActual<
                    typeof import('../src/models/ClassLinkIdentity')
                >('../src/models/ClassLinkIdentity');
                const theirs = new Date(Date.now() + 1000);
                vi.mocked(updateClassLinkIdentity).mockImplementationOnce(async (...args) => {
                    // assertHeld passed; the write is in flight when the lock expires and
                    // another holder replaces the pending record.
                    await cache.node.set(lockKey, 'another-holder');
                    await getClassLinkIdentitiesCollection().updateOne(
                        { firebaseUid: 'uid-test' },
                        { $set: { 'primaryEmail.at': theirs } }
                    );
                    return actual.updateClassLinkIdentity(...args);
                });
                expect(await errorOf(verify(email))).toMatchObject({
                    code: 'PRECONDITION_FAILED',
                    cause: { reason: 'busy' },
                });
                const stored = await identity();
                expect(stored?.personalEmail).toBeUndefined();
                expect(stored?.primaryEmail).toMatchObject({ state: 'pending', at: theirs });
                // T holds the address (the Firebase change landed): the reservation stays for
                // the retry or the reconcile.
                expect(firebaseEmail()).toBe(email);
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                    subject: 'same-subject',
                });
                expect(noticeRecipients()).toEqual([]);
            });

            it('the alias completion write compares the personal email read at the start', async () => {
                e2eAdminAuth.setUser({ uid: 'uid-test', email: 'own@example.org' });
                const actual = await vi.importActual<
                    typeof import('../src/models/ClassLinkIdentity')
                >('../src/models/ClassLinkIdentity');
                vi.mocked(updateClassLinkIdentity).mockImplementationOnce(async (...args) => {
                    await getClassLinkIdentitiesCollection().updateOne(
                        { firebaseUid: 'uid-test' },
                        {
                            $set: {
                                personalEmail: 'theirs@example.com',
                                personalEmailVerifiedAt: new Date(),
                            },
                        }
                    );
                    return actual.updateClassLinkIdentity(...args);
                });
                expect(await errorOf(verify(email))).toMatchObject({ code: 'PRECONDITION_FAILED' });
                expect((await identity())?.personalEmail).toBe('theirs@example.com');
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            });

            it('promote does not overwrite a record another holder wrote', async () => {
                const actual = await vi.importActual<typeof import('../src/models/AuthSubject')>(
                    '../src/models/AuthSubject'
                );
                const theirs = {
                    email: 'theirs@example.com',
                    uid: 'uid-test',
                    prevFirebaseEmail: school,
                    state: 'pending' as const,
                    at: new Date(),
                };
                vi.mocked(getOrCreateAuthSubjectLinkedTo).mockImplementationOnce(
                    async (...args) => {
                        await getClassLinkIdentitiesCollection().updateOne(
                            { firebaseUid: 'uid-test' },
                            { $set: { primaryEmail: theirs } }
                        );
                        return actual.getOrCreateAuthSubjectLinkedTo(...args);
                    }
                );
                expect(await errorOf(verify(email))).toMatchObject({ code: 'PRECONDITION_FAILED' });
                expect((await identity())?.primaryEmail).toMatchObject({
                    email: 'theirs@example.com',
                });
                expect(firebaseEmail()).toBe(school);
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            });
        });

        describe('abandoned reservations (LC-2409 review)', () => {
            const other = 'other@example.com';
            const third = 'third@example.com';
            const ageRecord = () =>
                getClassLinkIdentitiesCollection().updateOne(
                    { firebaseUid: 'uid-test' },
                    { $set: { 'primaryEmail.at': new Date(Date.now() - 11 * 60 * 1000) } }
                );
            /** Verify `address`, crashing at the completion write (T already holds it). */
            const crashAfterFirebase = async (address: string) => {
                vi.mocked(updateClassLinkIdentity).mockRejectedValueOnce(new Error('crash'));
                await expect(verify(address)).rejects.toThrow('crash');
                expect(firebaseEmail()).toBe(address);
            };

            it('a pending address replaced by a successful verify of another address is released', async () => {
                await crashAfterFirebase(email);
                expect(
                    (await findAuthSubjectByIdentityKey(`email:${email}`))?.reservedBy
                ).toBeTruthy();
                expect(await verify(other)).toEqual(promoted);
                // The abandoned reservation no longer blocks the address for other accounts.
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
                const linked = await findAuthSubjectByIdentityKey(`email:${other}`);
                expect(linked).toMatchObject({ subject: 'same-subject' });
                expect(linked?.reservedBy).toBeUndefined();
            });

            it('two abandoned addresses (A, then B replacing it) are both released by the reconcile', async () => {
                await crashAfterFirebase(email);
                await crashAfterFirebase(other);
                expect((await identity())?.primaryEmail).toMatchObject({
                    email: other,
                    replacedEmail: email,
                });
                await ageRecord();
                expect((await caller().reconcilePersonalEmail()).changed).toBe(true);
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
                expect(await findAuthSubjectByIdentityKey(`email:${other}`)).toBeNull();
                expect(firebaseEmail()).toBe(school);
            });

            it('A, then B, then C committed: neither A nor B stays reserved', async () => {
                await crashAfterFirebase(email);
                await crashAfterFirebase(other);
                expect(await verify(third)).toEqual(promoted);
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
                expect(await findAuthSubjectByIdentityKey(`email:${other}`)).toBeNull();
                expect(await findAuthSubjectByIdentityKey(`email:${third}`)).toMatchObject({
                    subject: 'same-subject',
                });
            });

            it('a takeover that fails before the promote write is released by the reconcile', async () => {
                await crashAfterFirebase(email);
                const first = (await identity())?.primaryEmail?.reservedBy;
                // The retry takes the reservation over, then fails before promote's write.
                vi.mocked(getOrCreateAuthSubjectLinkedTo).mockRejectedValueOnce(
                    new Error('transient')
                );
                await expect(verify(email)).rejects.toThrow('transient');
                const reserved = await findAuthSubjectByIdentityKey(`email:${email}`);
                expect(reserved?.reservedBy).toBeTruthy();
                expect(reserved?.reservedBy).not.toBe(first);
                expect((await identity())?.primaryEmail?.reservedBy).toBe(first);
                await ageRecord();
                expect((await caller().reconcilePersonalEmail()).changed).toBe(true);
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            });

            it('remove releases a taken-over reservation too', async () => {
                await crashAfterFirebase(email);
                vi.mocked(getOrCreateAuthSubjectLinkedTo).mockRejectedValueOnce(
                    new Error('transient')
                );
                await expect(verify(email)).rejects.toThrow('transient');
                await caller().removePersonalEmail();
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            });

            it("never releases another subject's reservation or a committed address", async () => {
                await getAuthSubjectsCollection().insertOne({
                    identityKey: 'email:theirs@example.com',
                    subject: 'their-subject',
                    email: 'theirs@example.com',
                    emailVerified: true,
                    createdAt: new Date(),
                    reservedBy: 'their-token',
                } as never);
                expect(await verify(email)).toEqual(promoted);
                // The committed address kept its token (its removal failed).
                await getAuthSubjectsCollection().updateOne(
                    { identityKey: `email:${email}` },
                    { $set: { reservedBy: 'stale-token' } }
                );
                // A change to another address stops at Firebase, and is reconciled.
                vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(
                    Object.assign(new Error('unavailable'), { code: 'auth/internal-error' })
                );
                await expect(verify(other)).rejects.toThrow();
                await ageRecord();
                expect((await caller().reconcilePersonalEmail()).changed).toBe(true);
                expect((await identity())?.personalEmail).toBe(email);
                // Their in-flight reservation, and this account's committed address, stay.
                expect(
                    await findAuthSubjectByIdentityKey('email:theirs@example.com')
                ).toMatchObject({ reservedBy: 'their-token' });
                expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                    subject: 'same-subject',
                });
                expect(await findAuthSubjectByIdentityKey(`email:${other}`)).toBeNull();
            });
        });

        describe('recent sign-in (LC-2409 review)', () => {
            const HOUR = 60 * 60 * 1000;
            const classLinkSignInAgo = (ms: number) =>
                getClassLinkIdentitiesCollection().updateOne(
                    { firebaseUid: 'uid-test' },
                    { $set: { lastAuthTime: new Date(Date.now() - ms) } }
                );
            const reason = async (promise: Promise<unknown>) => {
                const error = await errorOf(promise);
                expect(error).toMatchObject({ code: 'FORBIDDEN' });
                return error?.cause?.reason;
            };

            it('a ClassLink sign-in within 24 hours is enough', async () => {
                await classLinkSignInAgo(23 * HOUR);
                expect(await verify(email)).toEqual(promoted);
            });

            it('without a recent sign-in, start, verify and remove are refused before any code is sent', async () => {
                await verify(email);
                await classLinkSignInAgo(25 * HOUR);
                send.mockClear();
                expect(
                    await reason(caller().startPersonalEmail({ email: 'second@example.com' }))
                ).toBe('recent_sign_in_required');
                expect(send).not.toHaveBeenCalled();
                expect(
                    await reason(
                        caller().verifyPersonalEmail({
                            email: 'second@example.com',
                            code: '123456',
                        })
                    )
                ).toBe('recent_sign_in_required');
                expect(await reason(caller().removePersonalEmail())).toBe(
                    'recent_sign_in_required'
                );
                // Verifying the address is not itself a sign-in with it.
                expect(firebaseEmail()).toBe(email);
            });

            it('an email-code sign-in with the active sign-in email counts; another address does not', async () => {
                await verify(email);
                await classLinkSignInAgo(25 * HOUR);
                // The school email signing in is not the sign-in email.
                await getOrCreateAuthSubjectLinkedTo(`email:${school}`, 'same-subject', {
                    email: school,
                    emailVerified: true,
                });
                await recordEmailCodeSignIn(school);
                expect(
                    await reason(caller().startPersonalEmail({ email: 'second@example.com' }))
                ).toBe('recent_sign_in_required');
                // verifyLoginCode with the promoted address (mixed case, as typed).
                await recordEmailCodeSignIn('Personal@Example.com');
                expect(await verify('second@example.com')).toEqual(promoted);
            });

            it('an old email-code sign-in does not count', async () => {
                await verify(email);
                await classLinkSignInAgo(25 * HOUR);
                await getAuthSubjectsCollection().updateOne(
                    { identityKey: `email:${email}` },
                    { $set: { lastLoginAt: new Date(Date.now() - 25 * HOUR) } }
                );
                expect(await reason(caller().removePersonalEmail())).toBe(
                    'recent_sign_in_required'
                );
            });

            it('an account that signs in with its own email: an email-code sign-in to T counts', async () => {
                // T signs in with its own real address, so verify only links an alias and
                // there is no promotion whose subject could carry the sign-in.
                e2eAdminAuth.setUser({ uid: 'uid-test', email: 'own@example.org' });
                await classLinkSignInAgo(25 * HOUR);
                expect(await reason(caller().startPersonalEmail({ email }))).toBe(
                    'recent_sign_in_required'
                );
                // verifyLoginCode with T's own email (`found`, not an alias).
                await recordFirebaseSignIn('uid-test');
                expect(await verify(email)).toMatchObject({ primary: false });
                expect(await caller().removePersonalEmail()).toMatchObject({ removed: true });
            });

            it('after a removal, an email-code sign-in to T counts', async () => {
                await verify(email);
                await caller().removePersonalEmail();
                await classLinkSignInAgo(25 * HOUR);
                expect(
                    await reason(caller().startPersonalEmail({ email: 'second@example.com' }))
                ).toBe('recent_sign_in_required');
                await recordFirebaseSignIn('uid-test');
                expect(await verify('second@example.com')).toEqual(promoted);
            });

            it('a sign-in recorded on another uid, or an old one, does not count', async () => {
                await classLinkSignInAgo(25 * HOUR);
                await recordFirebaseSignIn('some-other-uid');
                await getClassLinkIdentitiesCollection().updateOne(
                    { firebaseUid: 'uid-test' },
                    { $set: { lastFirebaseSignIn: { uid: 'old-uid', at: new Date() } } }
                );
                expect(await reason(caller().startPersonalEmail({ email }))).toBe(
                    'recent_sign_in_required'
                );
                await recordFirebaseSignIn('uid-test', new Date(Date.now() - 25 * HOUR));
                expect(await reason(caller().startPersonalEmail({ email }))).toBe(
                    'recent_sign_in_required'
                );
                // An older sign-in never replaces a newer one.
                await recordFirebaseSignIn('uid-test');
                await recordFirebaseSignIn('uid-test', new Date(Date.now() - 25 * HOUR));
                await expect(caller().startPersonalEmail({ email })).resolves.toEqual({
                    success: true,
                });
            });

            describe('recordRecentSignIn (email link, Google, Apple: client-side sign-ins)', () => {
                const idToken = (overrides: { uid?: string; ago?: number; provider?: string }) =>
                    e2eAdminAuth.issueIdToken({
                        uid: overrides.uid ?? 'uid-test',
                        authTime: new Date(Date.now() - (overrides.ago ?? 60_000)),
                        signInProvider: overrides.provider ?? 'password',
                    });

                it('a fresh email-link sign-in to T counts once reported', async () => {
                    await verify(email);
                    await classLinkSignInAgo(25 * HOUR);
                    expect(await reason(caller().removePersonalEmail())).toBe(
                        'recent_sign_in_required'
                    );
                    expect(await caller().recordRecentSignIn({ idToken: idToken({}) })).toEqual({
                        recorded: true,
                    });
                    expect(await caller().removePersonalEmail()).toMatchObject({ removed: true });
                });

                it.each([
                    [
                        'a custom-token sign-in (verify and remove hand those out)',
                        { provider: 'custom' },
                    ],
                    ['an anonymous sign-in', { provider: 'anonymous' }],
                    ['a sign-in older than 24 hours', { ago: 25 * HOUR }],
                    ['a sign-in to another uid', { uid: 'other-uid' }],
                ])('%s does not count', async (_label, overrides) => {
                    await classLinkSignInAgo(25 * HOUR);
                    expect(
                        await caller().recordRecentSignIn({ idToken: idToken(overrides) })
                    ).toEqual({ recorded: false });
                    expect(await reason(caller().startPersonalEmail({ email }))).toBe(
                        'recent_sign_in_required'
                    );
                });

                it('a token that does not verify records nothing', async () => {
                    await classLinkSignInAgo(25 * HOUR);
                    expect(await caller().recordRecentSignIn({ idToken: 'forged' })).toEqual({
                        recorded: false,
                    });
                    expect((await identity())?.lastFirebaseSignIn).toBeUndefined();
                });

                it('is rate-limited per account', async () => {
                    for (let i = 0; i < 10; i++)
                        await caller().recordRecentSignIn({ idToken: 'forged' });
                    await expect(
                        caller().recordRecentSignIn({ idToken: idToken({}) })
                    ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
                });
            });

            it('recording an email-code sign-in never creates a subject', async () => {
                await recordEmailCodeSignIn('nobody@example.com');
                expect(await findAuthSubjectByIdentityKey('email:nobody@example.com')).toBeNull();
            });
        });

        describe('sign-in email notice (LC-2409 review)', () => {
            const linkSchoolEmail = () =>
                getOrCreateAuthSubjectLinkedTo(`email:${school}`, 'same-subject', {
                    email: school,
                    emailVerified: true,
                });
            const notices = () =>
                send.mock.calls
                    .filter(([message]) => message.templateAlias === 'sign-in-email-changed')
                    .map(([message]) => message);

            it('a first promotion tells the previous sign-in email, never the new one', async () => {
                await verify(email);
                expect(noticeRecipients()).toEqual([school]);
                expect(notices()[0]?.templateModel).toMatchObject({
                    maskedEmail: 'p*******@example.com',
                });
                expect(notices()[0]?.templateModel.changedAt).toEqual(expect.any(String));
            });

            it('a change tells the previous address and the live school address', async () => {
                await verify('first@example.com');
                await linkSchoolEmail();
                send.mockClear();
                await verify('second@example.com');
                expect(noticeRecipients()).toEqual(['first@example.com', school]);
                expect(noticeRecipients()).not.toContain('second@example.com');
            });

            it('re-verifying the active address sends nothing', async () => {
                await verify(email);
                send.mockClear();
                await verify(email);
                expect(noticeRecipients()).toEqual([]);
            });

            it('a placeholder account has no previous address: no notice to the new one alone', async () => {
                await makePlaceholder();
                await verify(email);
                expect(noticeRecipients()).toEqual([]);
            });

            it('remove tells the removed address and the school', async () => {
                await verify(email);
                await linkSchoolEmail();
                send.mockClear();
                await caller().removePersonalEmail();
                expect(noticeRecipients()).toEqual([email, school]);
                expect(notices()[0]?.templateModel).toMatchObject({
                    maskedEmail: 's******@example.edu',
                });
            });

            it('a failing notice never fails the change', async () => {
                send.mockImplementation(async (message: { templateAlias: string }) => {
                    if (message.templateAlias === 'sign-in-email-changed')
                        throw new Error('postmark down');
                });
                const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
                expect(await verify(email)).toEqual(promoted);
                await expect(caller().removePersonalEmail()).resolves.toMatchObject({
                    removed: true,
                });
                expect(warn).toHaveBeenCalledWith('classlink.sign_in_email_notice.failed', {
                    failed: 1,
                });
                warn.mockRestore();
            });
        });

        it('changing the address releases the old subject after the contact moves', async () => {
            await verify('first@example.com');
            await verify('second@example.com');
            expect(await findAuthSubjectByIdentityKey('email:first@example.com')).toBeNull();
            expect(firebaseEmail()).toBe('second@example.com');
            expect((await userKey())?.contactMethod).toEqual({
                type: 'email',
                value: 'second@example.com',
            });
            // The original values are kept for demote.
            expect((await identity())?.primaryEmail).toMatchObject({
                email: 'second@example.com',
                prevFirebaseEmail: school,
                prevContactMethod: { type: 'email', value: school },
            });
        });

        it('an address change interrupted before the Firebase write converges on retry', async () => {
            await verify('first@example.com');
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(
                Object.assign(new Error('unavailable'), { code: 'auth/internal-error' })
            );
            await expect(verify('second@example.com')).rejects.toThrow();
            expect(firebaseEmail()).toBe('first@example.com');
            expect((await identity())?.primaryEmail).toMatchObject({
                state: 'pending',
                email: 'second@example.com',
                replacedEmail: 'first@example.com',
                prevFirebaseEmail: school,
            });
            // The retry still promotes (T holds the replaced address) and returns T's token.
            expect(await verify('second@example.com')).toEqual(promoted);
            expect(firebaseEmail()).toBe('second@example.com');
            expect((await userKey())?.contactMethod).toEqual({
                type: 'email',
                value: 'second@example.com',
            });
            const stored = (await identity())?.primaryEmail;
            expect(stored).toMatchObject({
                state: 'active',
                email: 'second@example.com',
                prevFirebaseEmail: school,
                prevContactMethod: { type: 'email', value: school },
            });
            expect(stored?.replacedEmail).toBeUndefined();
        });

        it('an interrupted address change left for the reconcile is demoted fully', async () => {
            await verify('first@example.com');
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockRejectedValueOnce(
                Object.assign(new Error('unavailable'), { code: 'auth/internal-error' })
            );
            await expect(verify('second@example.com')).rejects.toThrow();
            await getClassLinkIdentitiesCollection().updateOne(
                { firebaseUid: 'uid-test' },
                { $set: { 'primaryEmail.at': new Date(Date.now() - 11 * 60 * 1000) } }
            );
            expect(await caller().reconcilePersonalEmail()).toMatchObject({ changed: true });
            // T and the contact no longer keep the replaced personal address.
            expect(firebaseEmail()).toBe(school);
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            expect((await identity())?.primaryEmail).toBeUndefined();
        });

        it('a contact CAS failure while changing the address restores the previous one', async () => {
            await verify('first@example.com');
            const original = e2eAdminAuth.auth.updateUser;
            vi.spyOn(e2eAdminAuth.auth, 'updateUser').mockImplementationOnce(async (...args) => {
                await mongodb
                    .collection('userkeys')
                    .updateOne(
                        { primaryDid: did },
                        { $set: { contactMethod: { type: 'email', value: 'moved@example.org' } } }
                    );
                return original(...args);
            });
            expect(await errorOf(verify('second@example.com'))).toMatchObject({
                code: 'CONFLICT',
            });
            expect(firebaseEmail()).toBe('first@example.com');
            expect(await findAuthSubjectByIdentityKey('email:second@example.com')).toBeNull();
            expect((await identity())?.primaryEmail).toMatchObject({
                state: 'active',
                email: 'first@example.com',
                prevFirebaseEmail: school,
            });
            expect(await caller().getPersonalEmail()).toEqual({
                email: 'first@example.com',
                verified: true,
            });
        });

        it('remove restores trusted school email / synthetic when untrusted, and restores the synthetic contact', async () => {
            await verify(email);
            expect(await caller().removePersonalEmail()).toEqual({
                success: true,
                removed: true,
                customToken: 'e2e-custom-token-uid-test',
            });
            expect(e2eAdminAuth.peek('uid-test')).toMatchObject({
                email: school,
                emailVerified: true,
            });
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });

            // The district no longer trusts the domain: T gets the synthetic address back.
            await verify(email);
            vi.mocked(getClassLinkConfig).mockReturnValue({
                ...getClassLinkConfig()!,
                tenants: {
                    'tenant-test': {
                        ...getClassLinkConfig()!.tenants['tenant-test']!,
                        allowedEmailDomains: [],
                    },
                },
            });
            await caller().removePersonalEmail();
            expect(firebaseEmail()).toBe('uid-test@users.classlink.invalid');
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });

            // A placeholder account without escrow gets its synthetic contact back.
            const synthetic = await makePlaceholder();
            await verify(email);
            await caller().removePersonalEmail();
            expect(firebaseEmail()).toBe(synthetic);
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: synthetic });
            expect((await identity())?.primaryEmail).toBeUndefined();
        });

        it('remove deletes email:personal', async () => {
            await verify(email);
            setContinuity({ enabled: false });
            await caller().removePersonalEmail();
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            expect(await caller().getPersonalEmail()).toEqual({ verified: false });
            await expect(caller().removePersonalEmail()).resolves.toEqual({
                success: true,
                removed: true,
            });
        });

        it('remove refuses placeholder with escrow', async () => {
            await makePlaceholder();
            await verify(email);
            await enrollEscrow();
            const error = await errorOf(caller().removePersonalEmail());
            expect(error).toMatchObject({ code: 'PRECONDITION_FAILED' });
            expect(error?.cause?.reason).toBe('placeholder_escrow');
            expect(firebaseEmail()).toBe(email);
            expect(await caller().getAccountContinuity()).toMatchObject({ canRemove: false });
            // Changing the address still works.
            expect(await verify('second@example.com')).toMatchObject({ primary: true });
        });

        it('serializes removal against a concurrent verification of a new address', async () => {
            await verify('first@example.com');
            await caller().startPersonalEmail({ email: 'second@example.com' });
            // Pause verify(B) mid-write, after it took the lock, then race remove(A).
            let removal: Promise<unknown> | undefined;
            vi.mocked(getOrCreateAuthSubjectLinkedTo).mockImplementationOnce(async (...args) => {
                removal = caller()
                    .removePersonalEmail()
                    .then(
                        () => 'removed',
                        (error: unknown) => error
                    );
                await removal;
                const actual = await vi.importActual<typeof import('../src/models/AuthSubject')>(
                    '../src/models/AuthSubject'
                );
                return actual.getOrCreateAuthSubjectLinkedTo(...args);
            });
            await expect(
                caller().verifyPersonalEmail({ email: 'second@example.com', code: getCode() })
            ).resolves.toMatchObject({ success: true, primary: true });
            // The removal was refused without writing, so B stays tracked everywhere.
            expect(await removal).toMatchObject({ code: 'PRECONDITION_FAILED' });
            expect(await caller().getPersonalEmail()).toEqual({
                email: 'second@example.com',
                verified: true,
            });
            expect(firebaseEmail()).toBe('second@example.com');
            expect(await findAuthSubjectByIdentityKey('email:first@example.com')).toBeNull();
            // Once the lock is released, a retry removes B everywhere.
            await caller().removePersonalEmail();
            expect(await findAuthSubjectByIdentityKey('email:second@example.com')).toBeNull();
            expect(firebaseEmail()).toBe(school);
            expect(await caller().getPersonalEmail()).toEqual({ verified: false });
        });
    });

    describe('getAccountContinuity', () => {
        const confirmed = (type: string, shareVersion = 1) => ({
            type,
            createdAt: new Date(),
            confirmedAt: new Date(),
            shareVersion,
        });
        /** Only the fields the continuity check reads; the real copy is sealed for the enclave. */
        const blob = (shareVersion = 1) => ({ shareVersion, blobHash: 'test-blob' });
        const pin = (overrides: Record<string, unknown> = {}) => ({
            salt: 'salt',
            failedAttempts: 0,
            enabledAt: new Date(),
            shareVersion: 1,
            ...overrides,
        });
        const setKey = (fields: Record<string, unknown>) =>
            mongodb
                .collection('userkeys')
                .updateOne({ primaryDid: did }, { $set: { shareVersion: 1, ...fields } });
        const verifyEmail = async (address = email) => {
            setContinuity({ defaultPolicy: { personalEmail: 'all', approval: 'none' } });
            await caller().startPersonalEmail({ email: address });
            await caller().verifyPersonalEmail({ email: address, code: getCode() });
        };
        const escrowWithPin = () =>
            setKey({
                recoveryMethods: [confirmed('escrow')],
                escrowBlob: blob(),
                escrowPin: pin(),
            });

        it('reports the next step without the district, policy or date of birth', async () => {
            setContinuity({
                defaultPolicy: { personalEmail: 'all', minimumAge: 13, approval: 'none' },
            });
            await makeStudent();
            vi.mocked(getCurrentProfile).mockResolvedValue({ dob: '2000-02-03' });
            const before = await caller().getAccountContinuity();
            expect(before).toEqual({
                personalEmail: { allowed: true },
                emailVerified: false,
                emailPrimary: false,
                primaryUid: 'uid-test',
                hasSchoolEmail: false,
                contactStale: false,
                canRemove: false,
                hasServerConfirmedMethod: false,
                hasUserRecoveryMethod: false,
                pinState: 'none',
                pinRecoverable: false,
                nextStep: 'email',
                pinChangeRequired: false,
                reconcilePending: false,
            });
            const serialized = JSON.stringify(before);
            for (const secret of ['tenant-test', '2000-02-03', 'minimumAge', '13'])
                expect(serialized).not.toContain(secret);

            await caller().startPersonalEmail({ email });
            await caller().verifyPersonalEmail({ email, code: getCode() });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailVerified: true,
                maskedEmail: 'p*******@example.com',
                emailPrimary: true,
                primaryUid: 'uid-test',
                signInEmailSource: 'personal',
                canRemove: true,
                nextStep: 'pin',
            });

            // Escrow counts for the server's recovery gate but is not a method the user holds.
            await setKey({ recoveryMethods: [confirmed('escrow')], escrowBlob: blob() });
            expect(await caller().getAccountContinuity()).toMatchObject({
                hasServerConfirmedMethod: true,
                hasUserRecoveryMethod: false,
                pinState: 'none',
                pinRecoverable: false,
                nextStep: 'pin',
            });
            await setKey({ recoveryMethods: [confirmed('escrow'), confirmed('passkey')] });
            expect(await caller().getAccountContinuity()).toMatchObject({
                hasUserRecoveryMethod: true,
                nextStep: 'done',
            });
        });

        it('needs the email first, even with a usable PIN', async () => {
            await escrowWithPin();
            expect(await caller().getAccountContinuity()).toMatchObject({
                pinState: 'enabled',
                pinRecoverable: true,
                nextStep: 'email',
            });
        });

        it.each([
            {
                name: 'escrow with an enabled PIN is done (email code + PIN recovers)',
                fields: { escrowPin: pin() },
                expected: { pinState: 'enabled', pinRecoverable: true, nextStep: 'done' },
            },
            {
                name: 'escrow without a PIN asks for a PIN',
                fields: {},
                expected: { pinState: 'none', pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'escrow with a locked PIN asks for a PIN again',
                fields: { escrowPin: pin({ failedAttempts: 10, disabledAt: new Date() }) },
                expected: { pinState: 'locked', pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'escrow with a PIN from an older share version asks for a PIN again',
                fields: {
                    shareVersion: 2,
                    recoveryMethods: [confirmed('escrow', 2)],
                    escrowBlob: blob(2),
                    escrowPin: pin({ shareVersion: 1 }),
                },
                expected: { pinState: 'stale', pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'opted-out escrow needs a passkey or phrase, even with a PIN record',
                fields: { escrowPin: pin(), escrowOptedOutAt: new Date() },
                expected: { pinState: 'enabled', pinRecoverable: false, nextStep: 'method' },
            },
            {
                name: 'a primary email without usable escrow (never enrolled) asks for a PIN',
                fields: { escrowBlob: undefined, escrowPin: pin() },
                expected: { pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'escrow confirmed only at an older copy version asks for a PIN',
                fields: { escrowBlob: blob(2), escrowPin: pin() },
                expected: { pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'no escrow (placeholder email) asks for a PIN',
                fields: { recoveryMethods: [], escrowBlob: undefined },
                expected: { pinState: 'none', pinRecoverable: false, nextStep: 'pin' },
            },
            {
                name: 'a passkey is done even when the PIN is locked',
                fields: {
                    recoveryMethods: [confirmed('escrow'), confirmed('passkey')],
                    escrowPin: pin({ disabledAt: new Date() }),
                },
                expected: {
                    hasUserRecoveryMethod: true,
                    pinState: 'locked',
                    pinRecoverable: false,
                    nextStep: 'done',
                },
            },
        ])('$name', async ({ fields, expected }) => {
            await verifyEmail();
            // `undefined` removes the field from the escrow-enrolled baseline.
            const entries = Object.entries(fields as Record<string, unknown>);
            await setKey({
                recoveryMethods: [confirmed('escrow')],
                escrowBlob: blob(),
                ...Object.fromEntries(entries.filter(([, value]) => value !== undefined)),
            });
            const unset = entries.filter(([, value]) => value === undefined);
            if (unset.length > 0)
                await mongodb
                    .collection('userkeys')
                    .updateOne(
                        { primaryDid: did },
                        { $unset: Object.fromEntries(unset.map(([field]) => [field, ''])) }
                    );
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailVerified: true,
                emailPrimary: true,
                ...expected,
            });
        });

        it('placeholder with no escrow gives pin', async () => {
            const synthetic = 'uid-test@users.classlink.invalid';
            e2eAdminAuth.setUser({ uid: 'uid-test', email: synthetic });
            await setKey({ contactMethod: { type: 'email', value: synthetic } });
            await verifyEmail();
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: true,
                canRemove: true,
                nextStep: 'pin',
            });
        });

        it('opted-out gives method, and so does a disabled escrow authority', async () => {
            await verifyEmail();
            await setKey({ escrowOptedOutAt: new Date() });
            expect((await caller().getAccountContinuity()).nextStep).toBe('method');
            await mongodb
                .collection('userkeys')
                .updateOne({ primaryDid: did }, { $unset: { escrowOptedOutAt: '' } });
            vi.mocked(isEscrowEnabled).mockReturnValue(false);
            expect((await caller().getAccountContinuity()).nextStep).toBe('method');
        });

        it('a legacy absent digest with a primary email gives confirmPin in remote mode and is never stale in software mode', async () => {
            await verifyEmail();
            await escrowWithPin();
            expect(await caller().getAccountContinuity()).toMatchObject({
                contactStale: false,
                nextStep: 'done',
            });
            vi.mocked(isEscrowRemoteMode).mockReturnValue(true);
            expect(await caller().getAccountContinuity()).toMatchObject({
                contactStale: true,
                nextStep: 'confirmPin',
            });
        });

        it('matching digest gives done; stale after removal gives confirmPin', async () => {
            vi.mocked(isEscrowRemoteMode).mockReturnValue(true);
            await verifyEmail();
            await escrowWithPin();
            await setKey({ escrowContactDigest: contactDigest(email) });
            expect(await caller().getAccountContinuity()).toMatchObject({
                contactStale: false,
                nextStep: 'done',
            });
            await caller().removePersonalEmail();
            // The sign-in email is the school email again; the copy still seals the personal one.
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                contactStale: true,
                nextStep: 'confirmPin',
                // The client's same-session gate needs T even without a promotion.
                primaryUid: 'uid-test',
                pinChangeRequired: false,
            });
            // Once a confirm hit a cap, continuity says so before the client rotates again.
            await cache.node.sadd(`escrow-confirm-versions:${did}`, '2', '3');
            expect(await caller().getAccountContinuity()).toMatchObject({
                nextStep: 'confirmPin',
                pinChangeRequired: true,
            });
            await cache.node.del(`escrow-confirm-versions:${did}`);
            await cache.node.set(`escrow-confirm-blocked:${did}`, '1');
            expect(await caller().getAccountContinuity()).toMatchObject({
                pinChangeRequired: true,
            });
        });

        it('no-PIN stale gives contactStale with done', async () => {
            vi.mocked(isEscrowRemoteMode).mockReturnValue(true);
            await verifyEmail();
            await setKey({
                recoveryMethods: [confirmed('escrow'), confirmed('passkey')],
                escrowBlob: blob(),
                escrowContactDigest: contactDigest(school),
            });
            expect(await caller().getAccountContinuity()).toMatchObject({
                contactStale: true,
                pinState: 'none',
                nextStep: 'done',
            });
        });

        it('own-email skips the email step', async () => {
            e2eAdminAuth.setUser({ uid: 'uid-test', email: 'own@example.org' });
            await setKey({ recoveryMethods: [confirmed('passkey')] });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                signInEmailSource: 'account',
                nextStep: 'done',
            });
        });

        it('drift reports emailPrimary false', async () => {
            await verifyEmail();
            e2eAdminAuth.setUser({ uid: 'uid-test', email: 'elsewhere@example.org' });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailVerified: true,
                emailPrimary: false,
                nextStep: 'email',
            });
        });

        it('hasSchoolEmail follows the allowlist and the idle limit', async () => {
            await getOrCreateAuthSubjectLinkedTo(`email:${school}`, 'same-subject', {
                email: school,
                emailVerified: true,
            });
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(true);
            const config = getClassLinkConfig()!;
            const tenant = config.tenants['tenant-test']!;
            const withTenant = (overrides: Record<string, unknown>) =>
                vi.mocked(getClassLinkConfig).mockReturnValue({
                    ...config,
                    tenants: { 'tenant-test': { ...tenant, ...overrides } },
                });
            withTenant({ allowedEmailDomains: [] });
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(false);
            withTenant({ schoolEmailAliasMaxIdleDays: 0 });
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(false);
            withTenant({ schoolEmailAliasMaxIdleDays: 30 });
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(true);
            await getClassLinkIdentitiesCollection().updateOne(
                { firebaseUid: 'uid-test' },
                { $set: { lastAuthTime: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } }
            );
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(false);
            // The default limit is 365 days.
            withTenant({});
            expect((await caller().getAccountContinuity()).hasSchoolEmail).toBe(true);
        });

        it('primaryUid is returned', async () => {
            await verifyEmail();
            expect((await caller().getAccountContinuity()).primaryUid).toBe('uid-test');
        });

        it('missing Admin app tolerated', async () => {
            await verifyEmail();
            const spy = vi
                .spyOn(e2eAdminAuth.auth, 'getUser')
                .mockRejectedValue(new Error('no app'));
            try {
                expect(await caller().getAccountContinuity()).toMatchObject({
                    emailPrimary: true,
                    nextStep: 'pin',
                });
            } finally {
                spy.mockRestore();
            }
        });

        it('demotePending is reconciled', async () => {
            await verifyEmail();
            await getClassLinkIdentitiesCollection().updateOne(
                { firebaseUid: 'uid-test' },
                { $set: { demotePending: { reason: 'rebind', at: new Date() } } }
            );
            expect(await caller().getAccountContinuity()).toMatchObject({
                reconcilePending: true,
            });
            expect(e2eAdminAuth.peek('uid-test')?.email).toBe(email);
            expect(await caller().reconcilePersonalEmail()).toEqual({
                changed: true,
                customToken: 'e2e-custom-token-uid-test',
            });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailPrimary: false,
                nextStep: 'email',
                reconcilePending: false,
            });
            expect(e2eAdminAuth.peek('uid-test')?.email).toBe(school);
            expect((await userKey())?.contactMethod).toEqual({ type: 'email', value: school });
            const stored = await getClassLinkIdentitiesCollection().findOne({
                firebaseUid: 'uid-test',
            });
            expect(stored?.primaryEmail).toBeUndefined();
            expect(stored?.demotePending).toBeUndefined();
        });

        it('reports a refusal reason and keeps FORBIDDEN for non-ClassLink accounts', async () => {
            await makeStudent();
            expect((await caller().getAccountContinuity()).personalEmail).toEqual({
                allowed: false,
                reason: 'students_excluded',
            });
            await getClassLinkIdentitiesCollection().deleteMany({});
            await expect(caller().getAccountContinuity()).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });

    describe('changing the personal email', () => {
        const first = 'first@example.com';
        const second = 'second@example.com';
        const verify = async (address: string) => {
            await caller().startPersonalEmail({ email: address });
            await caller().verifyPersonalEmail({ email: address, code: getCode() });
        };

        it('releases the replaced address', async () => {
            await verify(first);
            await verify(second);
            expect(await findAuthSubjectByIdentityKey(`email:${first}`)).toBeNull();
            expect(await findAuthSubjectByIdentityKey(`email:${second}`)).toMatchObject({
                subject: 'same-subject',
            });
            expect(await caller().getPersonalEmail()).toEqual({ email: second, verified: true });
        });

        it('keeps the replaced address when an account uses it as its contact', async () => {
            await verify(first);
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:other',
                authProviders: [{ type: 'firebase', id: 'other' }],
                contactMethod: { type: 'email', value: first },
            });
            await verify(second);
            expect(await findAuthSubjectByIdentityKey(`email:${first}`)).toMatchObject({
                subject: 'same-subject',
            });
        });

        it('leaves no email subject after deletion, and the old address can be added again', async () => {
            await verify(first);
            await verify(second);
            // The deleted account's own cascade (deleteMyData without a UserKey).
            const account = await mongodb.collection('userkeys').findOne({ primaryDid: did });
            await mongodb.collection('userkeys').deleteOne({ primaryDid: did });
            await deleteClassLinkDataForAccount({
                authProviders: account?.authProviders,
                primaryDid: did,
                linkedDids: [],
            } as never);
            expect(
                await getAuthSubjectsCollection().countDocuments({ subject: 'same-subject' })
            ).toBe(0);
            // A fresh ClassLink account (its Firebase user back on the school email) gets a new
            // subject.
            await mongodb.collection('userkeys').insertOne({
                primaryDid: did,
                authProviders: [{ type: 'firebase', id: 'uid-test' }],
                contactMethod: { type: 'email', value: school },
            });
            e2eAdminAuth.setUser({ uid: 'uid-test', email: school, emailVerified: true });
            await upsertClassLinkIdentity({
                identityKey: 'classlink:tenant-test:source-1',
                tenantId: 'tenant-test',
                sub: 'upstream',
                role: 'student',
                email: 'student@example.edu',
                sealedStateStudentId: null,
                state: 'XX',
                firebaseUid: 'uid-test',
                subject: 'new-subject',
                lastAuthTime: new Date(),
            });
            await verify(first);
            expect(await findAuthSubjectByIdentityKey(`email:${first}`)).toMatchObject({
                subject: 'new-subject',
            });
        });
    });
});
