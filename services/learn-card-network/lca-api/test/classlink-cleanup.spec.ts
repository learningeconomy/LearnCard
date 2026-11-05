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
import { createMinorPreferencesIfAbsent } from '../src/models/Preferences';
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
        await getClassLinkIdentitiesCollection().insertOne({
            ...identityWithoutId,
            firebaseUid: 'orphan_uid',
            identityKey: 'classlink:cleanup:orphan',
        });
        await expect(cleanupOrphanClassLinkData(false)).resolves.toBe(0);
        const liveCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: uid,
        });
        expect(liveCount).toBe(1);
        await expect(cleanupOrphanClassLinkData(true)).resolves.toBe(1);
        const orphanCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: 'orphan_uid',
        });
        const remainingLiveCount = await getClassLinkIdentitiesCollection().countDocuments({
            firebaseUid: uid,
        });
        expect(orphanCount).toBe(0);
        expect(remainingLiveCount).toBe(1);
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
});
