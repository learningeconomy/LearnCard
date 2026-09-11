import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { client } from '@mongo';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    upsertUserKeyByAuthProvider,
    setEscrowBlobByAuthProvider,
    clearEscrowByAuthProvider,
    setEscrowOptInByAuthProvider,
    removeRecoveryMethodFromUserKeyByAuthProvider,
    findUserKeyByAuthProvider,
    createEscrowHoldsIndexes,
    getEscrowHoldsCollection,
    createEscrowHold,
    cancelEscrowHold,
    completeEscrowHold,
    expireStaleEscrowHolds,
    generateEscrowResumeToken,
    hashEscrowResumeToken,
    findPendingEscrowHoldByAuthProvider,
    reserveEscrowPinAttempt,
    refundEscrowPinAttempt,
    type EscrowBlob,
    type AuthProviderMapping,
} from '@models';

const provider: AuthProviderMapping = { type: 'firebase', id: 'escrow-model-test' };
const blob: EscrowBlob = {
    envelope: {
        version: 1,
        algorithm: 'P-256-HKDF-SHA256-AES-256-GCM',
        keyId: 'test',
        ephemeralPublicKey: 'key',
        salt: 'salt',
        iv: 'iv',
        ciphertext: '$literal-data',
    },
    enclaveKeyId: 'test',
    enclaveMode: 'software',
    measurements: {},
    shareVersion: 1,
    createdAt: new Date(),
};
const createHold = (
    releaseAfter = new Date(),
    releasePolicy: 'hold' | 'pin' = 'hold'
): ReturnType<typeof createEscrowHold> =>
    createEscrowHold({
        authProvider: provider,
        primaryDid: 'did:key:test',
        shareVersion: 1,
        identityProofType: 'auth-token',
        requestedAt: new Date(),
        releaseAfter,
        releasePolicy,
        clientEphemeralPublicKey: 'public-key',
        resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
    });

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    await client.connect();
    await createUserKeysIndexes();
    await createEscrowHoldsIndexes();
});
beforeEach(async () => {
    await getUserKeysCollection().deleteMany({ 'authProviders.id': provider.id });
    await getEscrowHoldsCollection().deleteMany({ 'authProvider.id': provider.id });
    await upsertUserKeyByAuthProvider({ type: 'email', value: 'escrow@example.com' }, provider, {
        primaryDid: 'did:key:test',
        authShare: { encryptedData: 'data', encryptedDek: 'dek', iv: 'iv' },
    });
});
afterAll(async () => {
    await client.close();
});

describe('escrow model invariants', () => {
    it('migrates legacy pending holds before replacing the identity-only unique index', async () => {
        const collection = getEscrowHoldsCollection();
        await collection.createIndex(
            { 'authProvider.type': 1, 'authProvider.id': 1 },
            {
                name: 'pending_escrow_identity_unique',
                unique: true,
                partialFilterExpression: { status: 'pending' },
            }
        );
        const hold = await createHold();
        await collection.updateOne({ _id: hold._id }, { $unset: { releasePolicy: '' } });
        expect((await findPendingEscrowHoldByAuthProvider(provider, 'hold'))?._id).toBe(hold._id);
        await createEscrowHoldsIndexes();
        const indexes = await collection.listIndexes().toArray();
        expect(indexes.some(index => index.name === 'pending_escrow_identity_unique')).toBe(false);
        expect(
            indexes.find(index => index.name === 'pending_escrow_identity_policy_unique')
        ).toMatchObject({
            key: { 'authProvider.type': 1, 'authProvider.id': 1, releasePolicy: 1 },
            unique: true,
            partialFilterExpression: { status: 'pending' },
        });
        expect((await findPendingEscrowHoldByAuthProvider(provider, 'hold'))?.releasePolicy).toBe(
            'hold'
        );
        const pin = await createHold(new Date(), 'pin');
        expect((await findPendingEscrowHoldByAuthProvider(provider, 'pin'))?._id).toBe(pin._id);
        await expect(createHold()).rejects.toMatchObject({ code: 11000 });
        await expect(createHold(new Date(), 'pin')).rejects.toMatchObject({ code: 11000 });
    });

    it('refunds only matching active reservations and never makes attempts negative', async () => {
        await setEscrowBlobByAuthProvider(provider, blob, 1, {
            salt: Buffer.alloc(16).toString('base64'),
        });
        await reserveEscrowPinAttempt(provider, 1, blob.envelope.ciphertext);
        await refundEscrowPinAttempt(provider, 2, blob.envelope.ciphertext);
        await refundEscrowPinAttempt(provider, 1, 'replacement');
        expect(
            (await findUserKeyByAuthProvider(provider.type, provider.id))?.escrowPin?.failedAttempts
        ).toBe(1);
        await refundEscrowPinAttempt(provider, 1, blob.envelope.ciphertext);
        await refundEscrowPinAttempt(provider, 1, blob.envelope.ciphertext);
        expect(
            (await findUserKeyByAuthProvider(provider.type, provider.id))?.escrowPin?.failedAttempts
        ).toBe(0);
        await reserveEscrowPinAttempt(provider, 1, blob.envelope.ciphertext);
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': provider.id },
            { $set: { 'escrowPin.disabledAt': new Date() } }
        );
        await refundEscrowPinAttempt(provider, 1, blob.envelope.ciphertext);
        expect(
            (await findUserKeyByAuthProvider(provider.type, provider.id))?.escrowPin?.failedAttempts
        ).toBe(1);
    });
    it('atomically replaces escrow without duplicate methods and preserves literal values', async () => {
        await setEscrowBlobByAuthProvider(provider, blob, 1);
        const result = await setEscrowBlobByAuthProvider(provider, blob, 1);
        expect(result?.recoveryMethods).toHaveLength(1);
        expect(result?.recoveryMethods[0]).toMatchObject({
            type: 'escrow',
            confirmationStatus: 'confirmed',
            shareVersion: 1,
        });
        expect(result?.escrowBlob).toEqual(blob);
        expect(
            await setEscrowBlobByAuthProvider(provider, { ...blob, shareVersion: 2 }, 2)
        ).toBeNull();
    });
    it('clears with and without opting out; explicit opt-in permits enrollment again', async () => {
        await setEscrowBlobByAuthProvider(provider, blob, 1);
        const cleared = await clearEscrowByAuthProvider(provider, { optOut: false });
        expect(cleared?.escrowBlob).toBeUndefined();
        expect(cleared?.escrowOptedOutAt).toBeUndefined();
        expect(cleared?.recoveryMethods).toEqual([]);
        await setEscrowBlobByAuthProvider(provider, blob, 1);
        const optedOut = await clearEscrowByAuthProvider(provider, { optOut: true });
        expect(optedOut?.escrowOptedOutAt).toBeInstanceOf(Date);
        expect(await setEscrowBlobByAuthProvider(provider, blob, 1)).toBeNull();
        await clearEscrowByAuthProvider(provider, { optOut: false });
        expect(await setEscrowBlobByAuthProvider(provider, blob, 1)).toBeNull();
        await setEscrowOptInByAuthProvider(provider);
        expect(await setEscrowBlobByAuthProvider(provider, blob, 1)).not.toBeNull();
    });
    it('removes blobs on explicit method deletion and history pruning', async () => {
        await setEscrowBlobByAuthProvider(provider, blob, 1);
        await removeRecoveryMethodFromUserKeyByAuthProvider(provider, 'escrow');
        expect(
            (await findUserKeyByAuthProvider(provider.type, provider.id))?.escrowBlob
        ).toBeUndefined();
        await setEscrowBlobByAuthProvider(provider, blob, 1);
        for (let i = 0; i < 6; i++) {
            await upsertUserKeyByAuthProvider(
                { type: 'email', value: 'escrow@example.com' },
                provider,
                { authShare: { encryptedData: 'next', encryptedDek: 'dek', iv: 'iv' } }
            );
        }
        const result = await findUserKeyByAuthProvider(provider.type, provider.id);
        expect(result?.escrowBlob).toBeUndefined();
        expect(result?.recoveryMethods).toEqual([]);
    });
    it('allows only one pending hold and terminal transitions are conditional', async () => {
        const hold = await createHold();
        await expect(createHold()).rejects.toMatchObject({ code: 11000 });
        expect((await cancelEscrowHold(hold._id, 'did'))?.status).toBe('cancelled');
        expect(await cancelEscrowHold(hold._id, 'system')).toBeNull();
        expect(await completeEscrowHold(hold._id)).toBeNull();
        const next = await createHold();
        expect((await completeEscrowHold(next._id))?.status).toBe('completed');
        expect(await completeEscrowHold(next._id)).toBeNull();
        expect(await cancelEscrowHold(next._id, 'did')).toBeNull();
    });
    it('expires only stale pending holds and creates random hashed resume tokens', async () => {
        const now = new Date();
        const hold = await createHold(new Date(now.getTime() - 31 * 86_400_000));
        expect(await expireStaleEscrowHolds(now)).toBe(1);
        expect(await completeEscrowHold(hold._id)).toBeNull();
        expect(await cancelEscrowHold(hold._id, 'did')).toBeNull();
        const token = generateEscrowResumeToken();
        expect(token).toMatch(/^[0-9a-f]{64}$/);
        expect(generateEscrowResumeToken()).not.toBe(token);
        expect(hashEscrowResumeToken(token)).toMatch(/^[0-9a-f]{64}$/);
        expect(hashEscrowResumeToken(token)).not.toBe(token);
    });
});
