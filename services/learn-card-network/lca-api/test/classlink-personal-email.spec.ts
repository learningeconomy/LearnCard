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
    findAuthSubjectByIdentityKey,
} from '../src/models/AuthSubject';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../src/services/delivery', () => ({
    getDeliveryService: () => ({ send }),
    getFrom: () => 'login@example.com',
}));
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(),
}));
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
    });
});

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
        expect(await caller().verifyPersonalEmail({ email, code })).toEqual({ success: true });
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
    it('limits sends per DID across different email addresses', async () => {
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
});
