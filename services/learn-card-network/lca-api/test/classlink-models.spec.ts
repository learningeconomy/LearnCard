import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    findClassLinkIdentityForAccount,
    getClassLinkStudentStatus,
    resolveClassLinkContext,
} from '../src/helpers/classlinkContext.helpers';
import { getUserKeysCollection, type MongoUserKeyType } from '../src/models/UserKey';
import {
    clearExpiredStateStudentIds,
    clearStateStudentIdIfUnchanged,
    deleteClassLinkIdentitiesByFirebaseUid,
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
import { getStateStudentId, sealStateStudentId } from '../src/helpers/classlinkPii.helpers';
import {
    createTranscriptRequest,
    deleteTranscriptRequestsByFirebaseUid,
    findLatestTranscriptRequest,
    getTranscriptRequestsCollection,
} from '../src/models/TranscriptRequest';

const identity = (identityKey = 'classlink:tenant-test:source-1') => ({
    identityKey,
    tenantId: 'tenant-test',
    sub: 'sub-1',
    role: 'student',
    email: 'student@example.edu',
    state: 'XX',
    firebaseUid: 'uid-x',
    subject: 'subject-x',
    lastAuthTime: new Date('2026-01-01T00:00:00Z'),
});

afterEach(async () => {
    await Promise.all([
        getClassLinkIdentitiesCollection().deleteMany({}),
        getTranscriptRequestsCollection().deleteMany({}),
        getUserKeysCollection().deleteMany({}),
    ]);
});

describe('ClassLink and transcript models', () => {
    it('upserts idempotently and preserves createdAt', async () => {
        const first = await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey: first.identityKey },
            { $set: { ...{ sourcedId: 'legacy-sensitive-value' } } }
        );
        const second = await upsertClassLinkIdentity({
            ...identity(),
            email: 'new@example.edu',
            sealedStateStudentId: null,
        });
        expect(second.createdAt).toEqual(first.createdAt);
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                identityKey: first.identityKey,
            })
        ).toBe(1);
        expect(second.email).toBe('new@example.edu');
        expect(second).not.toHaveProperty('sourcedId');
    });

    it('enforces unique identity keys', async () => {
        await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
        await expect(
            getClassLinkIdentitiesCollection().insertOne({
                ...identity(),
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        ).rejects.toMatchObject({ code: 11000 });
    });

    it('returns the newest transcript request and deletes all rows for a uid', async () => {
        await createTranscriptRequest({
            jti: 'jti-old',
            firebaseUid: 'uid-x',
            did: 'did:example:1',
            identityKey: identity().identityKey,
            state: 'XX',
            consentAt: new Date('2026-01-01'),
            status: 'requested',
        });
        await createTranscriptRequest({
            jti: 'jti-new',
            firebaseUid: 'uid-x',
            did: 'did:example:1',
            identityKey: identity().identityKey,
            state: 'XX',
            consentAt: new Date('2026-01-02'),
            status: 'failed',
        });
        const latest = await findLatestTranscriptRequest('uid-x', 'XX');
        expect(latest?.jti).toBe('jti-new');
        expect(await deleteClassLinkIdentitiesByFirebaseUid('uid-x')).toBe(0);
        expect(await deleteTranscriptRequestsByFirebaseUid('uid-x')).toBe(2);
    });

    it('does not clear a state ID stored by a newer sign-in', async () => {
        const key = identity().identityKey;
        const stale = await upsertClassLinkIdentity({
            ...identity(),
            sealedStateStudentId: sealStateStudentId('state-old', key, new Date(), 60),
        });
        await upsertClassLinkIdentity({
            ...identity(),
            sealedStateStudentId: sealStateStudentId('state-new', key, new Date(), 3600),
        });
        await expect(clearStateStudentIdIfUnchanged(stale)).resolves.toBe(false);
        const current = await getClassLinkIdentitiesCollection().findOne({ identityKey: key });
        expect(getStateStudentId(current!)).toBe('state-new');
    });

    it('clears only expired and legacy plaintext state IDs', async () => {
        const fresh = identity('classlink:tenant-test:fresh');
        await upsertClassLinkIdentity({
            ...fresh,
            sealedStateStudentId: sealStateStudentId(
                'state-fresh',
                fresh.identityKey,
                new Date(),
                3600
            ),
        });
        const expired = identity('classlink:tenant-test:expired');
        await upsertClassLinkIdentity({
            ...expired,
            sealedStateStudentId: sealStateStudentId(
                'state-expired',
                expired.identityKey,
                new Date(),
                3600
            ),
        });
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey: expired.identityKey },
            { $set: { stateStudentIdExpiresAt: new Date(Date.now() - 1000) } }
        );
        await getClassLinkIdentitiesCollection().insertOne({
            ...identity('classlink:tenant-test:legacy'),
            stateStudentId: 'legacy-plaintext',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await expect(clearExpiredStateStudentIds()).resolves.toBe(2);
        const rows = await getClassLinkIdentitiesCollection().find({}).toArray();
        expect(JSON.stringify(rows)).not.toContain('legacy-plaintext');
        expect(rows.filter(row => row.stateStudentIdEnc)).toHaveLength(1);
        const kept = rows.find(row => row.identityKey === fresh.identityKey);
        expect(getStateStudentId(kept!)).toBe('state-fresh');
    });

    it('binds the ciphertext to its identity', async () => {
        const sealed = sealStateStudentId('state-1', 'classlink:a:1', new Date(), 3600)!;
        expect(
            getStateStudentId({
                identityKey: 'classlink:b:1',
                ...sealed,
            })
        ).toBeNull();
        expect(getStateStudentId({ identityKey: 'classlink:a:1', ...sealed })).toBe('state-1');
    });

    it('keeps the stored email when a later sign-in has none, and never stores null', async () => {
        await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
        const { email: _email, ...withoutEmail } = identity();
        const record = await upsertClassLinkIdentity({
            ...withoutEmail,
            sealedStateStudentId: null,
        });
        expect(record.email).toBe('student@example.edu');
        await upsertClassLinkIdentity({
            ...withoutEmail,
            identityKey: 'classlink:tenant-test:no-email',
            sealedStateStudentId: null,
        });
        expect(
            await getClassLinkIdentitiesCollection().findOne({
                identityKey: 'classlink:tenant-test:no-email',
            })
        ).not.toHaveProperty('email');
    });
});

describe('account-keyed ClassLink lookup', () => {
    const did = 'did:key:account';
    const account = (authProviders: { type: string; id: string }[]) =>
        ({
            primaryDid: did,
            linkedDids: ['did:key:linked'],
            authProviders,
            contactMethod: { type: 'email', value: 'student@example.edu' },
        }) as unknown as MongoUserKeyType;

    it('finds by Firebase uid and records the DID for later provider changes', async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            isMinorHint: true,
            sealedStateStudentId: null,
        });
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'uid-x' }]));
        expect(await getClassLinkStudentStatus(did)).toBe('student');
        expect(
            (await getClassLinkIdentitiesCollection().findOne({ firebaseUid: 'uid-x' }))?.primaryDid
        ).toBe(did);
    });

    it('keeps minor locks and transcript access after a recovery rebind removes the Firebase provider', async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            isMinorHint: true,
            sealedStateStudentId: null,
        });
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'uid-x' }]));
        await resolveClassLinkContext(did); // records primaryDid
        // completeIdentityRebind replaced the Firebase provider.
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { authProviders: [{ type: 'firebase', id: 'rebound-uid' }] } }
        );
        expect(await getClassLinkStudentStatus(did)).toBe('student');
        const context = await resolveClassLinkContext(did);
        expect(context.identity.identityKey).toBe('classlink:tenant-test:source-1');
        expect(context.firebaseUid).toBe('uid-x');
    });

    it('never lets an account matched only by a stale Firebase uid take over the recorded DID', async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            isMinorHint: true,
            primaryDid: did,
            sealedStateStudentId: null,
        });
        // The real account was rebound off uid-x; a fresh wallet was then made for uid-x.
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'rebound-uid' }]));
        await getUserKeysCollection().insertOne({
            ...account([{ type: 'firebase', id: 'uid-x' }]),
            primaryDid: 'did:key:fresh',
            linkedDids: [],
        });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await getClassLinkStudentStatus('did:key:fresh');
        expect(warn).toHaveBeenCalledWith('classlink.identity.did_kept');
        warn.mockRestore();
        expect(
            (await getClassLinkIdentitiesCollection().findOne({ firebaseUid: 'uid-x' }))?.primaryDid
        ).toBe(did);
        expect((await resolveClassLinkContext(did)).identity.identityKey).toBe(
            'classlink:tenant-test:source-1'
        );
    });

    it("replaces a recorded DID that no account holds any more, or that is this account's", async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            primaryDid: 'did:key:gone',
            sealedStateStudentId: null,
        });
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'uid-x' }]));
        await getClassLinkStudentStatus(did);
        expect((await getClassLinkIdentitiesCollection().findOne({}))?.primaryDid).toBe(did);
        // The account's linked DID was recorded; its primary DID replaces it.
        await getClassLinkIdentitiesCollection().updateOne(
            {},
            { $set: { primaryDid: 'did:key:linked' } }
        );
        await getClassLinkStudentStatus(did);
        expect((await getClassLinkIdentitiesCollection().findOne({}))?.primaryDid).toBe(did);
    });

    it('matches a Keycloak provider whose id is the identity subject, and a linked DID', async () => {
        await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
        expect(
            (
                await findClassLinkIdentityForAccount(
                    account([{ type: 'keycloak', id: 'subject-x' }])
                )
            )?.identityKey
        ).toBe('classlink:tenant-test:source-1');
        await upsertClassLinkIdentity({
            ...identity('classlink:tenant-test:source-2'),
            firebaseUid: 'uid-y',
            subject: 'subject-y',
            primaryDid: 'did:key:linked',
            sealedStateStudentId: null,
        });
        expect(
            (
                await findClassLinkIdentityForAccount(
                    account([{ type: 'keycloak', id: 'unrelated' }])
                )
            )?.identityKey
        ).toBe('classlink:tenant-test:source-2');
        expect(await findClassLinkIdentityForAccount(account([]))).toMatchObject({
            identityKey: 'classlink:tenant-test:source-2',
        });
    });

    it('reports not_student without a link and unknown on lookup failure', async () => {
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'none' }]));
        expect(await getClassLinkStudentStatus(did)).toBe('not_student');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        // getClassLinkIdentitiesCollection returns a fresh handle, so stub the prototype.
        const proto = Object.getPrototypeOf(getClassLinkIdentitiesCollection());
        const spy = vi.spyOn(proto, 'find').mockImplementation(() => {
            throw new Error('database down');
        });
        expect(await getClassLinkStudentStatus(did)).toBe('unknown');
        spy.mockRestore();
        warn.mockRestore();
    });
});
