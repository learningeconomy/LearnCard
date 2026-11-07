import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@environment', () => ({
    environment: { NODE_ENV: 'test', IS_E2E_TEST: false },
}));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    return { t, openRoute: t.procedure, didAndChallengeRoute: t.procedure };
});
vi.mock('../src/firebase', () => ({ default: { auth: vi.fn() } }));
vi.mock('../src/helpers/classlink.config', async importOriginal => ({
    ...(await importOriginal<typeof import('../src/helpers/classlink.config')>()),
    getClassLinkConfig: vi.fn(() => null),
}));

import { classlinkRouter } from '../src/routes/classlink';
import { getClassLinkIdentitiesCollection } from '../src/models/ClassLinkIdentity';
import {
    getTranscriptRequestsCollection,
    createTranscriptRequest,
} from '../src/models/TranscriptRequest';
import { getUserKeysCollection, type MongoUserKeyType } from '../src/models/UserKey';
import {
    CLASSLINK_PRIVACY_LOCK_SOURCE,
    createMinorPreferencesIfAbsent,
    enforceMinorPreferences,
} from '../src/models/Preferences';
import { getPrivacyLockState } from '../src/accesslayer/preferences/privacyLock';
import { getAuthSubjectsCollection, getOrCreateAuthSubject } from '../src/models/AuthSubject';
import { deleteClassLinkDataForAccount } from '../src/helpers/classlinkDeletion.helpers';
import { Preferences } from '../src/accesslayer/preferences';
import { ThemeEnum } from '../src/types/preferences';

const uid = 'classlink_cleanup_uid';
const did = 'did:key:cleanup';

const userKey = {
    primaryDid: did,
    linkedDids: [],
    authProviders: [{ type: 'firebase', id: uid }],
    contactMethod: { type: 'email', value: 'cleanup@example.test' },
} as unknown as MongoUserKeyType;

beforeEach(async () => {
    await Promise.all([
        getUserKeysCollection().deleteMany({}),
        getClassLinkIdentitiesCollection().deleteMany({}),
        getTranscriptRequestsCollection().deleteMany({}),
        getAuthSubjectsCollection().deleteMany({}),
        Preferences.deleteMany({}),
    ]);
    await getUserKeysCollection().insertOne(userKey);
    await getClassLinkIdentitiesCollection().insertOne({
        identityKey: 'classlink:cleanup:identity',
        tenantId: 'cleanup',
        sub: 'sub',
        role: 'student',
        email: 'cleanup@example.test',
        state: 'XX',
        firebaseUid: uid,
        subject: 'subject',
        lastAuthTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    await createTranscriptRequest({
        jti: 'cleanup-jti',
        firebaseUid: uid,
        did,
        identityKey: 'classlink:cleanup:identity',
        state: 'XX',
        consentAt: new Date(),
        status: 'requested',
    });
});

describe('ClassLink account cleanup', () => {
    it('deletes both data sets and is idempotent', async () => {
        const caller = classlinkRouter.createCaller({
            user: { did, isChallengeValid: true },
            domain: 'api.example',
            tenant: { id: 'learncard', resolvedVia: 'default', emailBranding: {} },
        });
        await expect(caller.deleteMyData({})).resolves.toEqual({ deleted: 2 });
        await expect(caller.deleteMyData({})).resolves.toEqual({ deleted: 0 });
        expect(await getClassLinkIdentitiesCollection().countDocuments({})).toBe(0);
        expect(await getTranscriptRequestsCollection().countDocuments({})).toBe(0);
    });

    it('keeps rows for live accounts and applies only orphan cleanup', async () => {
        const { cleanupOrphanClassLinkData } =
            await import('../src/helpers/classlinkCleanup.helpers');
        const liveIdentity = await getClassLinkIdentitiesCollection().findOne({});
        const { _id: _ignoredId, ...identityWithoutId } = liveIdentity!;
        const old = new Date(Date.now() - 31 * 86_400_000);
        await getClassLinkIdentitiesCollection().insertMany([
            {
                ...identityWithoutId,
                firebaseUid: 'orphan_uid',
                identityKey: 'classlink:cleanup:orphan',
                createdAt: old,
                updatedAt: old,
            },
            // Mid-setup: no UserKey yet, but too new to be an orphan.
            {
                ...identityWithoutId,
                firebaseUid: 'new_uid',
                identityKey: 'classlink:cleanup:new',
                createdAt: new Date(),
            },
            // Rebound: its Firebase uid is gone, but its recorded DID still has an account.
            {
                ...identityWithoutId,
                firebaseUid: 'rebound_uid',
                identityKey: 'classlink:cleanup:rebound',
                primaryDid: did,
                createdAt: old,
                updatedAt: old,
            },
            // Created long ago but signed in again recently (mid-setup): not an orphan.
            {
                ...identityWithoutId,
                firebaseUid: 'returning_uid',
                identityKey: 'classlink:cleanup:returning',
                createdAt: old,
                updatedAt: new Date(),
            },
        ]);
        await expect(cleanupOrphanClassLinkData(false)).resolves.toBe(0);
        const liveCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: uid,
        });
        expect(liveCount).toBe(1);
        await expect(cleanupOrphanClassLinkData({ apply: true })).resolves.toBe(1);
        const orphanCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: 'orphan_uid',
        });
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                identityKey: {
                    $in: [
                        'classlink:cleanup:new',
                        'classlink:cleanup:rebound',
                        'classlink:cleanup:returning',
                    ],
                },
            })
        ).toBe(3);
        const remainingLiveCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: uid,
        });
        expect(orphanCount).toBe(0);
        expect(remainingLiveCount).toBe(1);
    });

    it("removes a deleted account's leftovers even while another wallet holds the same uid", async () => {
        const { cleanupOrphanClassLinkData } =
            await import('../src/helpers/classlinkCleanup.helpers');
        const liveIdentity = await getClassLinkIdentitiesCollection().findOne({});
        const { _id: _ignoredId, ...identityWithoutId } = liveIdentity!;
        const old = new Date(Date.now() - 31 * 86_400_000);
        // The deleted account recorded its DID; the live UserKey on `uid` is someone else's
        // wallet now, and a uid alone never proves ownership of recorded-DID data.
        await getClassLinkIdentitiesCollection().insertOne({
            ...identityWithoutId,
            identityKey: 'classlink:cleanup:deleted-owner',
            firebaseUid: uid,
            primaryDid: 'did:key:deleted-owner',
            createdAt: old,
            updatedAt: old,
        });
        await getTranscriptRequestsCollection().insertOne({
            jti: 'deleted-owner-row',
            firebaseUid: uid,
            did: 'did:key:deleted-owner',
            primaryDid: 'did:key:deleted-owner',
            identityKey: 'classlink:cleanup:deleted-owner',
            state: 'XX',
            consentAt: old,
            requestedAt: old,
            status: 'requested',
        } as never);
        await cleanupOrphanClassLinkData({ apply: true });
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                identityKey: 'classlink:cleanup:deleted-owner',
            })
        ).toBe(0);
        expect(
            await getTranscriptRequestsCollection().countDocuments({ jti: 'deleted-owner-row' })
        ).toBe(0);
        // The live identity (no recorded DID, owned through its uid) is kept.
        expect(await getClassLinkIdentitiesCollection().countDocuments({ firebaseUid: uid })).toBe(
            1
        );
    });

    it('clears expired state IDs only when applied', async () => {
        const { clearExpiredClassLinkStateIds } =
            await import('../src/helpers/classlinkCleanup.helpers');
        await getClassLinkIdentitiesCollection().updateOne(
            { identityKey: 'classlink:cleanup:identity' },
            {
                $set: {
                    stateStudentIdEnc: 'v1:expired',
                    stateStudentIdExpiresAt: new Date(Date.now() - 1000),
                },
            }
        );
        await expect(clearExpiredClassLinkStateIds(false)).resolves.toBe(1);
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                stateStudentIdEnc: { $exists: true },
            })
        ).toBe(1);
        await expect(clearExpiredClassLinkStateIds(true)).resolves.toBe(1);
        expect(
            await getClassLinkIdentitiesCollection().countDocuments({
                stateStudentIdEnc: { $exists: true },
            })
        ).toBe(0);
    });

    it('creates minor defaults once and leaves existing preferences untouched', async () => {
        const minorDid = `did:key:minor-${Date.now()}`;
        await getClassLinkIdentitiesCollection().deleteMany({});
        await expect(createMinorPreferencesIfAbsent(minorDid)).resolves.toBe(true);
        await expect(createMinorPreferencesIfAbsent(minorDid)).resolves.toBe(false);
        expect(await Preferences.findOne({ did: minorDid })).toMatchObject({
            aiEnabled: false,
            analyticsEnabled: false,
            bugReportsEnabled: false,
            bugReportsAutoDisabled: true,
            isMinor: true,
        });
        await Preferences.deleteOne({ did: minorDid });
        await Preferences.insertOne({
            did: minorDid,
            theme: ThemeEnum.Colorful,
            aiEnabled: true,
        });
        await expect(createMinorPreferencesIfAbsent(minorDid)).resolves.toBe(false);
        expect(await Preferences.findOne({ did: minorDid })).toMatchObject({
            aiEnabled: true,
        });
    });

    describe('account deletion cascade', () => {
        const caller = (callerDid = did) =>
            classlinkRouter.createCaller({
                user: { did: callerDid, isChallengeValid: true },
                domain: 'api.example',
                tenant: { id: 'learncard', resolvedVia: 'default', emailBranding: {} },
            });

        it('removes the ClassLink and personal-email subjects but keeps the school email subject', async () => {
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey: 'classlink:cleanup:identity' },
                { $set: { personalEmail: 'me@personal.example' } }
            );
            await getOrCreateAuthSubject('classlink:cleanup:identity', { emailVerified: false });
            await getAuthSubjectsCollection().updateOne(
                { identityKey: 'classlink:cleanup:identity' },
                { $set: { subject: 'subject' } }
            );
            await getAuthSubjectsCollection().insertMany([
                {
                    identityKey: 'email:me@personal.example',
                    subject: 'subject',
                    emailVerified: true,
                    createdAt: new Date(),
                    lastLoginAt: new Date(),
                },
                {
                    identityKey: 'email:cleanup@example.test',
                    subject: 'subject',
                    emailVerified: true,
                    createdAt: new Date(),
                    lastLoginAt: new Date(),
                },
            ]);
            await expect(caller().deleteMyData({})).resolves.toEqual({ deleted: 2 });
            const remaining = await getAuthSubjectsCollection()
                .find({}, { projection: { identityKey: 1 } })
                .toArray();
            expect(remaining.map(record => record.identityKey)).toEqual([
                'email:cleanup@example.test',
            ]);
        });

        it('keeps a personal-email subject that another account signs in with', async () => {
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey: 'classlink:cleanup:identity' },
                { $set: { personalEmail: 'shared@personal.example' } }
            );
            await getUserKeysCollection().insertOne({
                primaryDid: 'did:key:other',
                linkedDids: [],
                authProviders: [{ type: 'firebase', id: 'other' }],
                contactMethod: { type: 'email', value: 'shared@personal.example' },
            } as unknown as MongoUserKeyType);
            await getAuthSubjectsCollection().insertOne({
                identityKey: 'email:shared@personal.example',
                subject: 'subject',
                emailVerified: true,
                createdAt: new Date(),
                lastLoginAt: new Date(),
            });
            await caller().deleteMyData({});
            expect(
                await getAuthSubjectsCollection().countDocuments({
                    identityKey: 'email:shared@personal.example',
                })
            ).toBe(1);
        });

        it('finds a rebound identity by DID and still works after the UserKey is gone', async () => {
            // Recovery rebind: the identity's Firebase uid is no longer on the account.
            await getClassLinkIdentitiesCollection().updateOne(
                { identityKey: 'classlink:cleanup:identity' },
                { $set: { firebaseUid: 'pre-rebind-uid', primaryDid: did } }
            );
            await getUserKeysCollection().deleteMany({});
            await expect(caller().deleteMyData({})).resolves.toEqual({ deleted: 2 });
            await expect(caller().deleteMyData({})).resolves.toEqual({ deleted: 0 });
        });

        it('never deletes another account by DID', async () => {
            await expect(caller('did:key:someone-else').deleteMyData({})).resolves.toEqual({
                deleted: 0,
            });
            expect(await getClassLinkIdentitiesCollection().countDocuments({})).toBe(1);
        });

        it('is exported for the key-deletion route and is idempotent', async () => {
            await expect(deleteClassLinkDataForAccount(userKey)).resolves.toMatchObject({
                identities: 1,
                transcriptRequests: 1,
            });
            await expect(deleteClassLinkDataForAccount(userKey)).resolves.toEqual({
                identities: 0,
                transcriptRequests: 0,
                authSubjects: 0,
                privacyLocks: 0,
            });
        });

        it('keeps the privacy lock while the account is live (deleteMyData by a signed-in student)', async () => {
            await enforceMinorPreferences(did);
            await caller(did).deleteMyData({});
            const stored = await Preferences.findOne({ did });
            expect(stored?.privacyLock).toMatchObject({ source: CLASSLINK_PRIVACY_LOCK_SOURCE });
            await expect(getPrivacyLockState(did, stored)).resolves.toBe('locked');
        });

        it('lifts the ClassLink privacy lock on account deletion but keeps the minor values', async () => {
            await enforceMinorPreferences(did);
            const locked = await Preferences.findOne({ did });
            await expect(getPrivacyLockState(did, locked)).resolves.toBe('locked');
            await expect(
                deleteClassLinkDataForAccount(userKey, { clearPrivacyLock: true })
            ).resolves.toMatchObject({
                privacyLocks: 1,
            });
            const stored = await Preferences.findOne({ did });
            expect(stored?.privacyLock).toBeUndefined();
            expect(stored).toMatchObject({ aiEnabled: false, analyticsEnabled: false });
            await expect(getPrivacyLockState(did, stored)).resolves.toBe('unlocked');
        });

        it('keeps a privacy lock from another source', async () => {
            await enforceMinorPreferences(did, 'other-source');
            await expect(
                deleteClassLinkDataForAccount(userKey, { clearPrivacyLock: true })
            ).resolves.toMatchObject({
                privacyLocks: 0,
            });
            expect((await Preferences.findOne({ did }))?.privacyLock).toMatchObject({
                source: 'other-source',
            });
        });
    });

    describe('automatic state ID retention', () => {
        it('clears expired state IDs at most once per interval and never throws', async () => {
            const { maybeClearExpiredStateStudentIds } =
                await import('../src/helpers/classlinkCleanup.helpers');
            const cache = (await import('@cache')).default;
            await (cache.redis ?? cache.node).del('classlink:retention:state-id-sweep');
            const expire = () =>
                getClassLinkIdentitiesCollection().updateOne(
                    { identityKey: 'classlink:cleanup:identity' },
                    {
                        $set: {
                            stateStudentIdEnc: 'v2:00000000:expired',
                            stateStudentIdExpiresAt: new Date(Date.now() - 1000),
                        },
                    }
                );
            await expire();
            await expect(maybeClearExpiredStateStudentIds()).resolves.toBe(1);
            await expire();
            await expect(maybeClearExpiredStateStudentIds()).resolves.toBeNull();
            expect(
                await getClassLinkIdentitiesCollection().countDocuments({
                    stateStudentIdEnc: { $exists: true },
                })
            ).toBe(1);
        });
    });

    describe('maintenance script arguments', () => {
        it('defaults to a state-ID-only dry run and requires an explicit orphan flag', async () => {
            const { parseCleanupArgs } = await import('../scripts/cleanup-orphan-classlink-data');
            expect(parseCleanupArgs([])).toEqual({
                apply: false,
                deleteOrphans: false,
                minAgeDays: 30,
            });
            expect(
                parseCleanupArgs(['--', '--apply', '--delete-orphans', '--min-age-days', '45'])
            ).toEqual({ apply: true, deleteOrphans: true, minAgeDays: 45 });
            expect(() => parseCleanupArgs(['--min-age-days', '0'])).toThrow('--min-age-days');
            expect(() => parseCleanupArgs(['--unknown'])).toThrow();
        });
    });
});
