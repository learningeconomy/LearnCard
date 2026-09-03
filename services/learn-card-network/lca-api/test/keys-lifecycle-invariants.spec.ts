import { client } from '@mongo';
import { randomBytes, randomUUID } from 'crypto';
import cache from '@cache';
import {
    consumeChallengeForDid,
    DID_CHALLENGE_TTL_SECS,
    getChallengeCacheKey,
    setValidChallengeForDid,
} from '@cache/challenges';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    PROVISIONAL_MIGRATION_TTL_MS,
    type MongoUserKeyType,
} from '@models';

import { getClient, getUser } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string => {
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');

    return `header.${payload}.signature`;
};

const makeUserKey = (
    email: string,
    uid: string,
    primaryDid: string,
    encryptedData = 'existing-auth-share'
): MongoUserKeyType => {
    const now = new Date();

    return {
        contactMethod: { type: 'email', value: email },
        authProviders: [{ type: 'firebase', id: uid }],
        primaryDid,
        linkedDids: [],
        keyProvider: 'sss',
        authShare: { encryptedData, encryptedDek: 'dek', iv: 'iv' },
        shareVersion: 1,
        shareUpdatedAt: now,
        previousAuthShares: [],
        securityLevel: 'basic',
        recoveryMethods: [],
        migratedFromWeb3Auth: false,
        createdAt: now,
        updatedAt: now,
    };
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    await client.connect();
    await createUserKeysIndexes();
});

afterAll(async () => {
    await client.close();
});

describe('P0-6 immutable provider identity', () => {
    it('does not return or mutate an old key when a new UID reuses its email', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `recycled-${suffix}@example.com`;
        const oldUid = `old-${suffix}`;
        const newUid = `new-${suffix}`;
        const { learnCard } = await getUser('b'.repeat(64));
        const collection = getUserKeysCollection();
        const oldRecord = makeUserKey(email, oldUid, learnCard.id.did());

        await collection.insertOne(oldRecord);

        try {
            const oldResult = await getClient().keys.getAuthShare({
                authToken: makeMockToken(email, oldUid),
                providerType: 'firebase',
            });
            const newResult = await getClient().keys.getAuthShare({
                authToken: makeMockToken(email, newUid),
                providerType: 'firebase',
            });

            expect(oldResult?.authShare?.encryptedData).toBe('existing-auth-share');
            expect(newResult).toBeNull();

            const unchanged = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: oldUid } },
            });

            expect(unchanged?.authProviders).toEqual([{ type: 'firebase', id: oldUid }]);

            await getClient({
                did: learnCard.id.did(),
                isChallengeValid: true,
            }).keys.storeAuthShare({
                authToken: makeMockToken(email, newUid),
                providerType: 'firebase',
                primaryDid: learnCard.id.did(),
                authShare: { encryptedData: 'new-auth-share', encryptedDek: 'dek', iv: 'iv' },
            });

            const records = await collection.find({ 'contactMethod.value': email }).toArray();
            const storedNewResult = await getClient().keys.getAuthShare({
                authToken: makeMockToken(email, newUid),
                providerType: 'firebase',
            });

            expect(records).toHaveLength(2);
            expect(
                records.find(record => record.authProviders[0]?.id === oldUid)?.authShare
            ).toMatchObject({ encryptedData: 'existing-auth-share' });
            expect(storedNewResult?.authShare?.encryptedData).toBe('new-auth-share');
            expect(storedNewResult?.sssActivationState).toBe('provisional');
        } finally {
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });
});

describe('P0-1 provisional SSS activation', () => {
    it('rejects activation with no recovery method at the current share version', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `activation-empty-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('e'.repeat(64));
        const collection = getUserKeysCollection();
        const key = makeUserKey(email, uid, learnCard.id.did());

        key.keyProvider = 'web3auth';
        key.sssActivationState = 'provisional';
        key.provisionalCreatedAt = new Date();
        await collection.insertOne(key);

        try {
            await expect(
                getClient({ did: learnCard.id.did(), isChallengeValid: true }).keys.activate({
                    authToken: token,
                    providerType: 'firebase',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const unchanged = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(unchanged?.sssActivationState).toBe('provisional');
            expect(unchanged?.keyProvider).toBe('web3auth');
            expect(unchanged?.migratedFromWeb3Auth).toBe(false);
        } finally {
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('atomically activates a migration with a confirmed version-matched recovery method', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const email = `activation-ready-${suffix}@example.com`;
        const uid = `uid-${suffix}`;
        const token = makeMockToken(email, uid);
        const { learnCard } = await getUser('6'.repeat(64));
        const collection = getUserKeysCollection();
        const key = makeUserKey(email, uid, learnCard.id.did());

        key.keyProvider = 'web3auth';
        key.sssActivationState = 'provisional';
        key.provisionalCreatedAt = new Date();
        key.recoveryMethods = [
            {
                type: 'backup',
                createdAt: new Date(),
                confirmationStatus: 'confirmed',
                confirmedAt: new Date(),
                shareVersion: 1,
            },
        ];
        await collection.insertOne(key);

        try {
            await expect(
                getClient({ did: learnCard.id.did(), isChallengeValid: true }).keys.activate({
                    authToken: token,
                    providerType: 'firebase',
                })
            ).resolves.toEqual({ success: true });

            const activated = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: uid } },
            });

            expect(activated?.sssActivationState).toBe('active');
            expect(activated?.provisionalCreatedAt).toBeUndefined();
            expect(activated?.keyProvider).toBe('sss');
            expect(activated?.migratedFromWeb3Auth).toBe(true);
            expect(activated?.migratedAt).toBeInstanceOf(Date);
        } finally {
            await collection.deleteMany({ 'contactMethod.value': email });
        }
    });

    it('lazily purges only expired provisional migration shares', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const migrationEmail = `expired-migration-${suffix}@example.com`;
        const newUserEmail = `expired-new-user-${suffix}@example.com`;
        const migrationUid = `migration-${suffix}`;
        const newUserUid = `new-user-${suffix}`;
        const migrationToken = makeMockToken(migrationEmail, migrationUid);
        const { learnCard } = await getUser('1'.repeat(64));
        const collection = getUserKeysCollection();
        const expiredAt = new Date(Date.now() - PROVISIONAL_MIGRATION_TTL_MS - 1_000);
        const migrationKey = makeUserKey(
            migrationEmail,
            migrationUid,
            learnCard.id.did(),
            'expired-migration-share'
        );
        const newUserKey = makeUserKey(
            newUserEmail,
            newUserUid,
            learnCard.id.did(),
            'new-user-share'
        );

        Object.assign(migrationKey, {
            keyProvider: 'web3auth' as const,
            sssActivationState: 'provisional' as const,
            provisionalCreatedAt: expiredAt,
            recoveryMethods: [{ type: 'backup' as const, createdAt: new Date(), shareVersion: 1 }],
        });
        Object.assign(newUserKey, {
            keyProvider: 'sss' as const,
            sssActivationState: 'provisional' as const,
            provisionalCreatedAt: expiredAt,
        });
        await collection.insertMany([migrationKey, newUserKey]);

        try {
            const result = await getClient().keys.getAuthShare({
                authToken: migrationToken,
                providerType: 'firebase',
            });
            const purgedMigration = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: migrationUid } },
            });
            const preservedNewUser = await collection.findOne({
                authProviders: { $elemMatch: { type: 'firebase', id: newUserUid } },
            });

            expect(result?.authShare).toBeNull();
            expect(purgedMigration?.authShare).toBeUndefined();
            expect(purgedMigration?.sssActivationState).toBeUndefined();
            expect(purgedMigration?.keyProvider).toBe('web3auth');
            expect(purgedMigration?.recoveryMethods).toEqual([]);
            expect(preservedNewUser?.authShare?.encryptedData).toBe('new-user-share');
            expect(preservedNewUser?.sssActivationState).toBe('provisional');
        } finally {
            await collection.deleteMany({
                'contactMethod.value': { $in: [migrationEmail, newUserEmail] },
            });
        }
    });
});

describe('P0-6 fresh DID authorization', () => {
    it('issues short-lived challenges that can only be consumed once', async () => {
        const did = `did:key:${randomUUID()}`;
        const challenge = randomBytes(32).toString('hex');

        await setValidChallengeForDid(did, challenge);

        const ttl = await cache.ttl(getChallengeCacheKey(did, challenge));

        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(DID_CHALLENGE_TTL_SECS);
        await expect(consumeChallengeForDid(did, challenge)).resolves.toBe(true);
        await expect(consumeChallengeForDid(did, challenge)).resolves.toBe(false);
    });

    it.each([
        ['no DID VP', getClient(), 'UNAUTHORIZED'],
        ['stale DID challenge', undefined, 'UNAUTHORIZED'],
        ['mismatched DID', undefined, 'FORBIDDEN'],
    ] as const)(
        '%s rejects every sensitive write without modifying the key record',
        async (_name, providedCaller, expectedCode) => {
            const suffix = `${Date.now()}-${randomUUID()}`;
            const email = `challenge-${suffix}@example.com`;
            const uid = `uid-${suffix}`;
            const token = makeMockToken(email, uid);
            const { learnCard } = await getUser('c'.repeat(64));
            const { learnCard: otherLearnCard } = await getUser('d'.repeat(64));
            const collection = getUserKeysCollection();
            const key = makeUserKey(email, uid, learnCard.id.did());
            const caller =
                providedCaller ??
                (_name === 'stale DID challenge'
                    ? getClient({ did: learnCard.id.did() })
                    : getClient({ did: otherLearnCard.id.did(), isChallengeValid: true }));

            await collection.insertOne(key);

            const actions = [
                () =>
                    caller.keys.storeAuthShare({
                        authToken: token,
                        providerType: 'firebase',
                        primaryDid: learnCard.id.did(),
                        authShare: { encryptedData: 'replacement', encryptedDek: 'dek', iv: 'iv' },
                    }),
                () =>
                    caller.keys.addRecoveryMethod({
                        authToken: token,
                        providerType: 'firebase',
                        type: 'backup',
                        shareVersion: 1,
                    }),
                () =>
                    caller.keys.deleteRecoveryMethod({
                        authToken: token,
                        providerType: 'firebase',
                        type: 'backup',
                    }),
                () =>
                    caller.keys.confirmRecoveryMethod({
                        authToken: token,
                        providerType: 'firebase',
                        type: 'backup',
                    }),
                () => caller.keys.markMigrated({ authToken: token, providerType: 'firebase' }),
                () => caller.keys.activate({ authToken: token, providerType: 'firebase' }),
                () =>
                    caller.keys.addRecoveryEmail({
                        authToken: token,
                        providerType: 'firebase',
                        email: `recovery-${suffix}@example.com`,
                    }),
                () =>
                    caller.keys.verifyRecoveryEmail({
                        authToken: token,
                        providerType: 'firebase',
                        code: '000000',
                    }),
            ];

            try {
                const before = await collection.findOne({
                    authProviders: { $elemMatch: { type: 'firebase', id: uid } },
                });

                for (const action of actions) {
                    await expect(action()).rejects.toMatchObject({ code: expectedCode });
                }

                const after = await collection.findOne({
                    authProviders: { $elemMatch: { type: 'firebase', id: uid } },
                });

                expect(after).toEqual(before);
            } finally {
                await collection.deleteMany({ 'contactMethod.value': email });
            }
        }
    );
});
