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
import { getCurrentProfile } from '../src/helpers/currentProfile';
import { updateClassLinkIdentity } from '../src/models/ClassLinkIdentity';

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
const getCode = () => String(send.mock.calls.at(-1)?.[0].templateModel.verificationCode);

beforeEach(async () => {
    send.mockReset().mockResolvedValue(undefined);
    await cache.node.flushall();
    await mongodb.collection('userkeys').deleteMany({});
    await getClassLinkIdentitiesCollection().deleteMany({});
    await getAuthSubjectsCollection().deleteMany({});
    await mongodb
        .collection('userkeys')
        .insertOne({ primaryDid: did, authProviders: [{ type: 'firebase', id: 'uid-test' }] });
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
    it('still finds the identity by DID after a recovery rebind drops the Firebase provider', async () => {
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
        expect(await caller().verifyPersonalEmail({ email, code: getCode() })).toEqual({
            success: true,
            recoveryEmailSet: true,
        });
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
        expect(await caller().verifyPersonalEmail({ email, code })).toEqual({
            success: true,
            recoveryEmailSet: true,
        });
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
    it('counts every guess before comparing, so parallel guesses cannot exceed the limit', async () => {
        await caller().startPersonalEmail({ email });
        const results = await Promise.allSettled(
            Array.from({ length: 12 }, () =>
                caller().verifyPersonalEmail({ email, code: '000000' })
            )
        );
        expect(results.every(result => result.status === 'rejected')).toBe(true);
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
        await expect(caller().verifyPersonalEmail({ email, code: getCode() })).resolves.toEqual({
            success: true,
            recoveryEmailSet: true,
        });
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

    describe('recovery email', () => {
        const verify = async (address: string) => {
            await caller().startPersonalEmail({ email: address });
            return caller().verifyPersonalEmail({ email: address, code: getCode() });
        };

        it('makes the verified address the recovery email', async () => {
            expect(await verify(email)).toEqual({ success: true, recoveryEmailSet: true });
            expect(await userKey()).toMatchObject({
                recoveryEmail: email,
                recoveryEmailVerifiedAt: expect.any(Date),
            });
        });

        it('follows the personal email when it replaces it, and is idempotent', async () => {
            await verify('first@example.com');
            expect(await verify('second@example.com')).toMatchObject({ recoveryEmailSet: true });
            expect((await userKey())?.recoveryEmail).toBe('second@example.com');
            expect(await verify('second@example.com')).toMatchObject({ recoveryEmailSet: true });
        });

        it('never replaces a different recovery email the user verified', async () => {
            await mongodb.collection('userkeys').updateOne(
                { primaryDid: did },
                {
                    $set: {
                        recoveryEmail: 'chosen@example.com',
                        recoveryEmailVerifiedAt: new Date(),
                    },
                }
            );
            expect(await verify(email)).toEqual({ success: true, recoveryEmailSet: false });
            expect((await userKey())?.recoveryEmail).toBe('chosen@example.com');
        });

        it('never overwrites a recovery email verified after the plan', async () => {
            // Runs after the recovery-email plan and before its write.
            vi.mocked(getOrCreateAuthSubjectLinkedTo).mockImplementationOnce(async (...args) => {
                await mongodb.collection('userkeys').updateOne(
                    { primaryDid: did },
                    {
                        $set: {
                            recoveryEmail: 'chosen@example.com',
                            recoveryEmailVerifiedAt: new Date(),
                        },
                    }
                );
                const actual = await vi.importActual<typeof import('../src/models/AuthSubject')>(
                    '../src/models/AuthSubject'
                );
                return actual.getOrCreateAuthSubjectLinkedTo(...args);
            });
            expect(await verify(email)).toEqual({ success: true, recoveryEmailSet: false });
            expect((await userKey())?.recoveryEmail).toBe('chosen@example.com');
            expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
        });

        it('replaces an unverified recovery email', async () => {
            await mongodb
                .collection('userkeys')
                .updateOne({ primaryDid: did }, { $set: { recoveryEmail: 'typo@example.com' } });
            expect(await verify(email)).toMatchObject({ recoveryEmailSet: true });
            expect((await userKey())?.recoveryEmail).toBe(email);
        });

        it('skips an address another account recovers with, but still links sign-in', async () => {
            await mongodb.collection('userkeys').insertOne({
                primaryDid: 'did:key:sibling',
                authProviders: [{ type: 'firebase', id: 'sibling' }],
                recoveryEmail: email,
                recoveryEmailVerifiedAt: new Date(),
            });
            expect(await verify(email)).toEqual({
                success: true,
                recoveryEmailSet: false,
                recoveryEmailSkipped: 'shared',
            });
            expect((await userKey())?.recoveryEmail).toBeUndefined();
            expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                subject: 'same-subject',
            });
        });

        it('converges on retry after a failure between writes', async () => {
            vi.mocked(updateClassLinkIdentity).mockRejectedValueOnce(new Error('injected'));
            await expect(verify(email)).rejects.toThrow();
            // The sign-in link and recovery email were written; the identity was not.
            expect(await caller().getPersonalEmail()).toEqual({ verified: false });
            expect((await userKey())?.recoveryEmail).toBe(email);
            expect(await verify(email)).toEqual({ success: true, recoveryEmailSet: true });
            expect(await caller().getPersonalEmail()).toEqual({ email, verified: true });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toMatchObject({
                subject: 'same-subject',
            });
        });

        it('removePersonalEmail clears all three stores, even when not allowed', async () => {
            await verify(email);
            setContinuity({ enabled: false });
            await expect(caller().removePersonalEmail()).resolves.toEqual({ success: true });
            expect(await findAuthSubjectByIdentityKey(`email:${email}`)).toBeNull();
            expect(await userKey()).not.toHaveProperty('recoveryEmail');
            expect(await userKey()).not.toHaveProperty('recoveryEmailVerifiedAt');
            expect(await caller().getPersonalEmail()).toEqual({ verified: false });
            await expect(caller().removePersonalEmail()).resolves.toEqual({ success: true });
        });

        it('removePersonalEmail keeps a different recovery email', async () => {
            await verify(email);
            await mongodb
                .collection('userkeys')
                .updateOne({ primaryDid: did }, { $set: { recoveryEmail: 'chosen@example.com' } });
            await caller().removePersonalEmail();
            expect((await userKey())?.recoveryEmail).toBe('chosen@example.com');
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
        const verifyEmail = async () => {
            setContinuity({ defaultPolicy: { personalEmail: 'all', approval: 'none' } });
            await caller().startPersonalEmail({ email });
            await caller().verifyPersonalEmail({ email, code: getCode() });
        };

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
                recoveryEmailVerified: false,
                hasServerConfirmedMethod: false,
                hasUserRecoveryMethod: false,
                pinState: 'none',
                pinRecoverable: false,
                nextStep: 'email',
            });
            const serialized = JSON.stringify(before);
            for (const secret of ['tenant-test', '2000-02-03', 'minimumAge', '13'])
                expect(serialized).not.toContain(secret);

            await caller().startPersonalEmail({ email });
            await caller().verifyPersonalEmail({ email, code: getCode() });
            expect(await caller().getAccountContinuity()).toMatchObject({
                emailVerified: true,
                maskedEmail: 'p*******@example.com',
                recoveryEmailVerified: true,
                nextStep: 'method',
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
            await mongodb
                .collection('userkeys')
                .updateOne(
                    { primaryDid: did },
                    { $set: { recoveryMethods: [confirmed('escrow'), confirmed('passkey')] } }
                );
            expect(await caller().getAccountContinuity()).toMatchObject({
                hasUserRecoveryMethod: true,
                nextStep: 'done',
            });
        });

        it('needs the email first, even with a usable PIN', async () => {
            await setKey({
                recoveryMethods: [confirmed('escrow')],
                escrowBlob: blob(),
                escrowPin: pin(),
            });
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
                name: 'a confirmed escrow method without a stored copy needs a passkey or phrase',
                fields: { escrowBlob: undefined, escrowPin: pin() },
                expected: { pinRecoverable: false, nextStep: 'method' },
            },
            {
                name: 'escrow confirmed only at an older copy version needs a passkey or phrase',
                fields: { escrowBlob: blob(2), escrowPin: pin() },
                expected: { pinRecoverable: false, nextStep: 'method' },
            },
            {
                name: 'no escrow (placeholder email) needs a passkey or phrase',
                fields: { recoveryMethods: [], escrowBlob: undefined },
                expected: { pinState: 'none', pinRecoverable: false, nextStep: 'method' },
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
                recoveryEmailVerified: true,
                ...expected,
            });
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
            const account = await mongodb.collection('userkeys').findOne({ primaryDid: did });
            await deleteClassLinkDataForAccount(account as never);
            expect(
                await getAuthSubjectsCollection().countDocuments({ subject: 'same-subject' })
            ).toBe(0);
            // A fresh ClassLink sign-in gets a new subject.
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
