import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    findClassLinkIdentitiesForAccount,
    findClassLinkIdentityForAccount,
    getClassLinkStudentStatus,
    getOwningFirebaseUids,
    matchClassLinkIdentitiesForAccount,
    pinClassLinkIdentitiesToAccount,
    resolveClassLinkContext,
} from '../src/helpers/classlinkContext.helpers';
import { deleteClassLinkDataForAccount } from '../src/helpers/classlinkDeletion.helpers';
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

    describe('a fresh wallet made for a uid or subject its owner moved away from', () => {
        const fresh = 'did:key:fresh';
        const setup = async (stale: { type: string; id: string }) => {
            await upsertClassLinkIdentity({
                ...identity(),
                isMinorHint: true,
                primaryDid: did,
                sealedStateStudentId: sealStateStudentId(
                    'state-id',
                    identity().identityKey,
                    new Date(),
                    3600
                ),
            });
            await createTranscriptRequest({
                jti: 'jti-owner',
                firebaseUid: 'uid-x',
                did,
                primaryDid: did,
                identityKey: identity().identityKey,
                state: 'XX',
                consentAt: new Date(),
                status: 'requested',
            });
            // The owner was rebound/revoked off uid-x; a fresh wallet was then made for it.
            await getUserKeysCollection().insertOne(
                account([{ type: 'firebase', id: 'rebound-uid' }])
            );
            await getUserKeysCollection().insertOne({
                ...account([stale]),
                primaryDid: fresh,
                linkedDids: [],
            });
        };

        it.each([
            ['Firebase uid', { type: 'firebase', id: 'uid-x' }],
            ['Keycloak subject', { type: 'keycloak', id: 'subject-x' }],
        ])('gets no access to the identity through a stale %s', async (_kind, stale) => {
            await setup(stale);
            const freshKey = (await getUserKeysCollection().findOne({ primaryDid: fresh }))!;
            await expect(findClassLinkIdentitiesForAccount(freshKey)).resolves.toEqual([]);
            await expect(resolveClassLinkContext(fresh)).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
            // Still the same student signing in: the fresh wallet stays privacy locked.
            expect(await getClassLinkStudentStatus(fresh)).toBe('student');
            // Deleting the fresh wallet's ClassLink data removes nothing of the owner's.
            await expect(deleteClassLinkDataForAccount(freshKey)).resolves.toMatchObject({
                identities: 0,
                transcriptRequests: 0,
                authSubjects: 0,
            });
            // The owner is unaffected and keeps its recorded DID.
            const owner = await resolveClassLinkContext(did);
            expect(owner.identity).toMatchObject({
                identityKey: 'classlink:tenant-test:source-1',
                primaryDid: did,
            });
            expect(getStateStudentId(owner.identity)).toBe('state-id');
            expect(await getTranscriptRequestsCollection().countDocuments()).toBe(1);
        });

        it('does not count the stale uid toward the fresh wallet ownership of records', async () => {
            await setup({ type: 'firebase', id: 'uid-x' });
            const freshKey = (await getUserKeysCollection().findOne({ primaryDid: fresh }))!;
            const matched = await matchClassLinkIdentitiesForAccount(freshKey);
            expect(matched.heldElsewhere.map(item => item.identityKey)).toEqual([
                'classlink:tenant-test:source-1',
            ]);
            expect(await getOwningFirebaseUids(freshKey, matched)).toEqual([]);
            // The owner still owns its history through the identity's uid and its DID.
            const owner = await resolveClassLinkContext(did);
            expect([...owner.ownerFirebaseUids].sort()).toEqual(['rebound-uid', 'uid-x']);
        });
    });

    it('pins an unrecorded identity before a rebind, so a stale-uid wallet cannot claim it', async () => {
        // The identity never recorded its DID (e.g. locked at sign-in, no transcript use yet).
        await upsertClassLinkIdentity({ ...identity(), sealedStateStudentId: null });
        const owner = account([{ type: 'firebase', id: 'uid-x' }]);
        await getUserKeysCollection().insertOne(owner);
        // keys.completeRecoveryRebind / revokeOtherDevices pin before removing the uid.
        await pinClassLinkIdentitiesToAccount(owner);
        expect((await getClassLinkIdentitiesCollection().findOne({}))?.primaryDid).toBe(did);
        await getUserKeysCollection().updateOne(
            { primaryDid: did },
            { $set: { authProviders: [{ type: 'firebase', id: 'rebound-uid' }] } }
        );
        // A fresh wallet created with the stale uid matches nothing.
        const stale = {
            primaryDid: 'did:key:stale',
            linkedDids: [],
            authProviders: [{ type: 'firebase', id: 'uid-x' }],
        } as unknown as MongoUserKeyType;
        await getUserKeysCollection().insertOne(stale);
        expect(await findClassLinkIdentitiesForAccount(stale)).toEqual([]);
        await expect(resolveClassLinkContext('did:key:stale')).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        expect((await resolveClassLinkContext(did)).identity.identityKey).toBe(
            'classlink:tenant-test:source-1'
        );
    });

    it('never overwrites a recorded DID when pinning', async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            primaryDid: 'did:key:other',
            sealedStateStudentId: null,
        });
        await pinClassLinkIdentitiesToAccount(account([{ type: 'firebase', id: 'uid-x' }]));
        expect((await getClassLinkIdentitiesCollection().findOne({}))?.primaryDid).toBe(
            'did:key:other'
        );
    });

    it('gives an orphaned identity (recorded account deleted) no access through a uid alone', async () => {
        // The owner was deleted and the cascade did not finish: the identity still records
        // the owner's DID, which no account holds any more.
        await upsertClassLinkIdentity({
            ...identity(),
            primaryDid: 'did:key:gone',
            isMinorHint: true,
            sealedStateStudentId: null,
        });
        const stale = account([{ type: 'firebase', id: 'uid-x' }]);
        await getUserKeysCollection().insertOne(stale);
        const matched = await matchClassLinkIdentitiesForAccount(stale);
        expect(matched.identities).toEqual([]);
        expect(matched.orphaned.map(item => item.identityKey)).toEqual([
            'classlink:tenant-test:source-1',
        ]);
        await expect(resolveClassLinkContext(did)).rejects.toMatchObject({ code: 'FORBIDDEN' });
        // Still the same sign-in, so it stays privacy-locked as a student.
        await expect(getClassLinkStudentStatus(did)).resolves.toBe('student');
        // A status lookup never re-records it; only a fresh ClassLink proof does.
        expect((await getClassLinkIdentitiesCollection().findOne({}))?.primaryDid).toBe(
            'did:key:gone'
        );
        // Its owner is gone, so deleting the wallet's ClassLink data removes the leftover.
        expect(await deleteClassLinkDataForAccount(stale)).toMatchObject({ identities: 1 });
    });

    it("replaces a recorded DID with the account's primary DID when it is one of its own", async () => {
        await upsertClassLinkIdentity({
            ...identity(),
            primaryDid: 'did:key:linked',
            sealedStateStudentId: null,
        });
        await getUserKeysCollection().insertOne(account([{ type: 'firebase', id: 'uid-x' }]));
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
