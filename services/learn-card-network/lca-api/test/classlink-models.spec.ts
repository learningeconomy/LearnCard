import { afterEach, describe, expect, it } from 'vitest';
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
    sourcedId: 'source-1',
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
    ]);
});

describe('ClassLink and transcript models', () => {
    it('upserts idempotently and preserves createdAt', async () => {
        const first = await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
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
});
