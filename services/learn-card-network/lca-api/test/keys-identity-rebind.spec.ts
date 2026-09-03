import { randomUUID } from 'crypto';

import { client } from '@mongo';
import cache from '@cache';
import { getRecoverySessionCacheKey } from '@cache/recoverySessions';
import { createUserKeysIndexes, getUserKeysCollection, type MongoUserKeyType } from '@models';
import * as delivery from '../src/services/delivery';

import { getClient, getUser } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string => {
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');

    return `header.${payload}.signature`;
};

const makeRecoverableUser = (
    loginEmail: string,
    recoveryEmail: string,
    uid: string,
    primaryDid: string
): MongoUserKeyType => {
    const now = new Date();

    return {
        contactMethod: { type: 'email', value: loginEmail },
        authProviders: [{ type: 'firebase', id: uid }],
        primaryDid,
        linkedDids: [],
        keyProvider: 'sss',
        authShare: { encryptedData: 'version-one-auth-share', encryptedDek: '', iv: '' },
        shareVersion: 2,
        shareUpdatedAt: now,
        previousAuthShares: [
            {
                authShare: { encryptedData: 'version-one-auth-share', encryptedDek: '', iv: '' },
                shareVersion: 1,
                createdAt: now,
            },
        ],
        securityLevel: 'enhanced',
        recoveryMethods: [
            {
                type: 'phrase',
                createdAt: now,
                confirmationStatus: 'confirmed',
                confirmedAt: now,
                shareVersion: 1,
            },
        ],
        recoveryEmail,
        recoveryEmailVerifiedAt: now,
        migratedFromWeb3Auth: false,
        sssActivationState: 'active',
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

describe('P0-3 lost-identity recovery sessions', () => {
    const startAndReadCode = async (recoveryEmail: string): Promise<string> => {
        const send = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(delivery, 'getDeliveryService').mockReturnValue({ send });

        await getClient().keys.startRecoverySession({ email: recoveryEmail });

        const call = send.mock.calls[0]?.[0] as
            | { templateModel?: { verificationCode?: string } }
            | undefined;
        const code = call?.templateModel?.verificationCode;

        if (!code) throw new Error('Recovery OTP was not delivered in the test');

        return code;
    };

    it('locks the OTP after five incorrect attempts', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const recoveryEmail = `recovery-lock-${suffix}@example.com`;
        const loginEmail = `old-lock-${suffix}@example.edu`;
        const { learnCard } = await getUser('b'.repeat(64));
        const collection = getUserKeysCollection();

        await collection.insertOne(
            makeRecoverableUser(loginEmail, recoveryEmail, `old-${suffix}`, learnCard.id.did())
        );

        try {
            const correctCode = await startAndReadCode(recoveryEmail);

            for (let attempt = 1; attempt <= 4; attempt += 1) {
                await expect(
                    getClient().keys.verifyRecoverySession({ email: recoveryEmail, code: '000000' })
                ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            }

            await expect(
                getClient().keys.verifyRecoverySession({ email: recoveryEmail, code: '000000' })
            ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
            await expect(
                getClient().keys.verifyRecoverySession({ email: recoveryEmail, code: correctCode })
            ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        } finally {
            vi.restoreAllMocks();
            await collection.deleteMany({ recoveryEmail });
        }
    });

    it('enforces token expiry, one-use replay protection, and route scope', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const recoveryEmail = `recovery-token-${suffix}@example.com`;
        const loginEmail = `old-token-${suffix}@example.edu`;
        const { learnCard } = await getUser('c'.repeat(64));
        const collection = getUserKeysCollection();

        await collection.insertOne(
            makeRecoverableUser(loginEmail, recoveryEmail, `old-${suffix}`, learnCard.id.did())
        );

        try {
            const code = await startAndReadCode(recoveryEmail);
            const verified = await getClient().keys.verifyRecoverySession({
                email: recoveryEmail,
                code,
            });

            await expect(
                getClient({
                    did: learnCard.id.did(),
                    isChallengeValid: true,
                }).keys.completeRecoveryRebind({
                    recoverySessionToken: verified.recoverySessionToken,
                    newAuthToken: makeMockToken(`new-${suffix}@example.com`, `new-${suffix}`),
                    providerType: 'firebase',
                    primaryDid: learnCard.id.did(),
                    authShare: { encryptedData: 'new-share', encryptedDek: '', iv: '' },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                getClient().keys.useRecoverySession({
                    recoverySessionToken: verified.recoverySessionToken,
                    type: 'phrase',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        } finally {
            vi.restoreAllMocks();
            await collection.deleteMany({ recoveryEmail });
            await cache.node.flushall();
        }
    });

    it('rebinds a new UID, purges history, and invalidates old recovery methods', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const recoveryEmail = `recovery-happy-${suffix}@example.com`;
        const oldLoginEmail = `old-happy-${suffix}@example.edu`;
        const newLoginEmail = `new-happy-${suffix}@example.com`;
        const oldUid = `old-${suffix}`;
        const newUid = `new-${suffix}`;
        const { learnCard } = await getUser('d'.repeat(64));
        const collection = getUserKeysCollection();

        await collection.insertOne(
            makeRecoverableUser(oldLoginEmail, recoveryEmail, oldUid, learnCard.id.did())
        );

        try {
            const code = await startAndReadCode(recoveryEmail);
            const verified = await getClient().keys.verifyRecoverySession({
                email: recoveryEmail,
                code,
            });
            const recovered = await getClient().keys.useRecoverySession({
                recoverySessionToken: verified.recoverySessionToken,
                type: 'phrase',
            });

            expect(recovered.authShare.encryptedData).toBe('version-one-auth-share');
            expect(recovered.shareVersion).toBe(1);
            await expect(
                getClient().keys.useRecoverySession({
                    recoverySessionToken: verified.recoverySessionToken,
                    type: 'phrase',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const result = await getClient({
                did: learnCard.id.did(),
                isChallengeValid: true,
            }).keys.completeRecoveryRebind({
                recoverySessionToken: recovered.rebindSessionToken,
                newAuthToken: makeMockToken(newLoginEmail, newUid),
                providerType: 'firebase',
                primaryDid: learnCard.id.did(),
                authShare: { encryptedData: 'rotated-auth-share', encryptedDek: '', iv: '' },
            });

            expect(result.shareVersion).toBe(3);
            expect(result.recoveryMethodsRequireConfirmation).toEqual(['phrase']);

            const stored = await collection.findOne({ primaryDid: learnCard.id.did() });
            expect(stored?.authProviders).toContainEqual({ type: 'firebase', id: newUid });
            expect(stored?.authProviders).not.toContainEqual({ type: 'firebase', id: oldUid });
            expect(stored?.previousAuthShares).toEqual([]);
            expect(stored?.recoveryMethods[0]).toMatchObject({
                type: 'phrase',
                shareVersion: 3,
                confirmationStatus: 'pending',
            });
            expect(stored?.recoveryMethods[0]?.confirmedAt).toBeUndefined();

            const oldStatus = await getClient().keys.getAuthShare({
                authToken: makeMockToken(oldLoginEmail, oldUid),
                providerType: 'firebase',
            });
            const newStatus = await getClient().keys.getAuthShare({
                authToken: makeMockToken(newLoginEmail, newUid),
                providerType: 'firebase',
            });

            expect(oldStatus).toBeNull();
            expect(newStatus?.authShare?.encryptedData).toBe('rotated-auth-share');
            expect(newStatus?.recoveryMethods).toEqual([]);
        } finally {
            vi.restoreAllMocks();
            await collection.deleteMany({ recoveryEmail });
            await cache.node.flushall();
        }
    });

    it('rejects an expired recovery token and a recovery token used as provider auth', async () => {
        const suffix = `${Date.now()}-${randomUUID()}`;
        const recoveryEmail = `recovery-expiry-${suffix}@example.com`;
        const loginEmail = `old-expiry-${suffix}@example.edu`;
        const { learnCard } = await getUser('e'.repeat(64));
        const collection = getUserKeysCollection();

        await collection.insertOne(
            makeRecoverableUser(loginEmail, recoveryEmail, `old-${suffix}`, learnCard.id.did())
        );

        try {
            const code = await startAndReadCode(recoveryEmail);
            const verified = await getClient().keys.verifyRecoverySession({
                email: recoveryEmail,
                code,
            });

            await cache.delete([getRecoverySessionCacheKey(verified.recoverySessionToken)]);
            await expect(
                getClient().keys.useRecoverySession({
                    recoverySessionToken: verified.recoverySessionToken,
                    type: 'phrase',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                getClient().keys.getAuthShare({
                    authToken: verified.recoverySessionToken,
                    providerType: 'firebase',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        } finally {
            vi.restoreAllMocks();
            await collection.deleteMany({ recoveryEmail });
            await cache.node.flushall();
        }
    });
});
