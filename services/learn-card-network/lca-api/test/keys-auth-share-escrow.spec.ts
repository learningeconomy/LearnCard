import { randomUUID } from 'crypto';

import { client } from '@mongo';
import { createUserKeysIndexes, getUserKeysCollection, type MongoUserKeyType } from '@models';

import { getClient } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string => {
    const payload = Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url');

    return `header.${payload}.signature`;
};

const makeUser = (
    uid: string,
    email: string,
    recoveryMethods: MongoUserKeyType['recoveryMethods']
): MongoUserKeyType => {
    const now = new Date();

    return {
        contactMethod: { type: 'email', value: email },
        authProviders: [{ type: 'firebase', id: uid }],
        primaryDid: `did:key:z${uid}`,
        linkedDids: [],
        keyProvider: 'sss',
        authShare: { encryptedData: 'auth-share', encryptedDek: '', iv: '' },
        shareVersion: 3,
        shareUpdatedAt: now,
        previousAuthShares: [],
        securityLevel: 'enhanced',
        recoveryMethods,
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

describe('getAuthShare priorEscrowEnrollment', () => {
    const statusFor = async (recoveryMethods: MongoUserKeyType['recoveryMethods']) => {
        const uid = `auth-share-escrow-${randomUUID()}`;
        const email = `${uid}@example.com`;
        const collection = getUserKeysCollection();
        await collection.insertOne(makeUser(uid, email, recoveryMethods));
        try {
            return await getClient().keys.getAuthShare({
                authToken: makeMockToken(email, uid),
                providerType: 'firebase',
            });
        } finally {
            await collection.deleteMany({ 'authProviders.id': uid });
        }
    };
    const now = new Date();

    it('is false for an escrow method confirmed at the current share version', async () => {
        const status = await statusFor([
            {
                type: 'escrow',
                createdAt: now,
                shareVersion: 3,
                confirmationStatus: 'confirmed',
                confirmedAt: now,
            },
        ]);
        expect(status?.priorEscrowEnrollment).toBe(false);
        expect(status?.recoveryMethods).toHaveLength(1);
    });

    it('is true for an escrow method left pending by an identity-recovery rebind', async () => {
        const status = await statusFor([
            { type: 'escrow', createdAt: now, shareVersion: 3, confirmationStatus: 'pending' },
        ]);
        expect(status?.priorEscrowEnrollment).toBe(true);
        // The pending method itself is still never exposed.
        expect(status?.recoveryMethods).toEqual([]);
    });

    it('is false when the account has no escrow method', async () => {
        const status = await statusFor([
            {
                type: 'phrase',
                createdAt: now,
                shareVersion: 3,
                confirmationStatus: 'confirmed',
                confirmedAt: now,
            },
        ]);
        expect(status?.priorEscrowEnrollment).toBe(false);
    });
});
