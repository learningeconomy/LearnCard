import { afterEach, describe, expect, it } from 'vitest';
import {
    deleteClassLinkIdentitiesByFirebaseUid,
    getClassLinkIdentitiesCollection,
    upsertClassLinkIdentity,
} from '../src/models/ClassLinkIdentity';
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
    stateStudentId: 'state-1',
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
        const first = await upsertClassLinkIdentity(identity());
        const second = await upsertClassLinkIdentity({ ...identity(), email: 'new@example.edu' });
        expect(second.createdAt).toEqual(first.createdAt);
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                identityKey: first.identityKey,
            })
        ).toBe(1);
        expect(second.email).toBe('new@example.edu');
    });

    it('enforces unique identity keys', async () => {
        await upsertClassLinkIdentity(identity());
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
});
