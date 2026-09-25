import { randomUUID } from 'crypto';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { client } from '@mongo';
import {
    type EscrowHold,
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
    cancelEscrowHoldByCancelToken,
    completeEscrowHold,
    expireStaleEscrowHolds,
    ESCROW_HOLD_STALE_WINDOW_MS,
    generateEscrowResumeToken,
    hashEscrowResumeToken,
    findPendingEscrowHoldByAuthProvider,
    findEscrowHoldById,
    findEscrowHoldsDueForReminder,
    claimEscrowHoldForReminder,
    recordEscrowHoldNotification,
    rotateEscrowCancelToken,
    reserveEscrowPinAttempt,
    refundEscrowPinAttempt,
    type EscrowBlob,
    type AuthProviderMapping,
} from '@models';

const provider: AuthProviderMapping = { type: 'firebase', id: 'escrow-model-test' };
const blob: Omit<EscrowBlob, 'enrollmentEpoch' | 'blobHash'> = {
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
        holdRecord: {
            hold: {
                holdId: randomUUID(),
                did: 'did:key:test',
                shareVersion: 1,
                blobHash: 'ab'.repeat(32),
                enrollmentEpoch: 1,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: 'public-key',
                createdLo: 0,
                createdHi: 0,
                policyVersion: 1,
                signature: 'test-signature',
            },
            holdDurationMs: 0,
            ledgerSeq: 0,
        },
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
    it('validates required opaque hold records before insert', async () => {
        const valid = await createHold();
        expect(valid._id).toBe(valid.holdRecord.hold.holdId);
        await cancelEscrowHold(valid._id, 'did');
        const input = {
            ...valid,
            holdRecord: {
                ...valid.holdRecord,
                hold: { ...valid.holdRecord.hold, holdId: randomUUID(), signedExtension: 'keep' },
                signedExtension: 'keep',
            },
        };
        const opaque = await createEscrowHold(input);
        expect(opaque.holdRecord).toEqual(input.holdRecord);
        await cancelEscrowHold(opaque._id, 'did');
        for (const holdRecord of [
            undefined,
            {},
            { ...valid.holdRecord, ledgerSeq: 'invalid' },
            { ...valid.holdRecord, hold: { ...valid.holdRecord.hold, enrollmentEpoch: 0 } },
        ]) {
            // Simulate untyped/legacy input at the runtime schema boundary.
            await expect(
                createEscrowHold({ ...input, holdRecord } as unknown as Parameters<
                    typeof createEscrowHold
                >[0])
            ).rejects.toThrow('Invalid escrow hold');
        }
    });
    it('computes the Rust-order fixed blob hash and increments epochs atomically', async () => {
        const first = await setEscrowBlobByAuthProvider(provider, blob, 1);
        expect(first?.escrowBlob?.enrollmentEpoch).toBe(1);
        expect(first?.escrowBlob?.blobHash).toBe(
            'a531b47276c2837a51306766f654de4ee8b4e7114c1960eeb993b6260f0c8ea9'
        );
        const results = await Promise.all([
            setEscrowBlobByAuthProvider(provider, blob, 1),
            setEscrowBlobByAuthProvider(provider, blob, 1),
        ]);
        expect(results.map(result => result?.escrowBlob?.enrollmentEpoch).sort()).toEqual([2, 3]);
        expect(results[0]?.escrowBlob?.envelope.ciphertext).toBe('$literal-data');
        await expect(
            setEscrowBlobByAuthProvider(
                provider,
                { ...blob, envelope: { ...blob.envelope, ciphertext: '' } },
                1
            )
        ).rejects.toThrow('Invalid escrow payload');
        expect(
            await setEscrowBlobByAuthProvider(provider, { ...blob, enclaveKeyId: 'other' }, 1)
        ).toBeNull();
        expect(
            (await findUserKeyByAuthProvider(provider.type, provider.id))?.escrowBlob
                ?.enrollmentEpoch
        ).toBe(3);
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
        expect(result?.escrowBlob).toEqual({
            ...blob,
            enrollmentEpoch: 2,
            blobHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        });
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
        const hold = await createHold(new Date(now.getTime() - ESCROW_HOLD_STALE_WINDOW_MS - 1));
        // Claiming must enforce expiry even before lazy cleanup has run.
        expect(await completeEscrowHold(hold._id)).toBeNull();
        expect(await expireStaleEscrowHolds(now)).toBe(1);
        expect(await completeEscrowHold(hold._id)).toBeNull();
        expect(await cancelEscrowHold(hold._id, 'did')).toBeNull();
        const token = generateEscrowResumeToken();
        expect(token).toMatch(/^[0-9a-f]{64}$/);
        expect(generateEscrowResumeToken()).not.toBe(token);
        expect(hashEscrowResumeToken(token)).toMatch(/^[0-9a-f]{64}$/);
        expect(hashEscrowResumeToken(token)).not.toBe(token);
    });
    it('cancels via link token exactly once, rejecting wrong, reused, or hash-less holds', async () => {
        const cancelTokenHash = 'a'.repeat(64);
        const hold = await createEscrowHold({
            holdRecord: {
                hold: {
                    holdId: randomUUID(),
                    did: 'did:key:test',
                    shareVersion: 1,
                    blobHash: 'ab'.repeat(32),
                    enrollmentEpoch: 1,
                    releasePolicy: 'hold',
                    clientEphemeralPublicKey: 'public-key',
                    createdLo: 0,
                    createdHi: 0,
                    policyVersion: 1,
                    signature: 'test-signature',
                },
                holdDurationMs: 0,
                ledgerSeq: 0,
            },
            authProvider: provider,
            primaryDid: 'did:key:test',
            shareVersion: 1,
            identityProofType: 'auth-token',
            requestedAt: new Date(),
            releaseAfter: new Date(),
            releasePolicy: 'hold',
            clientEphemeralPublicKey: 'public-key',
            resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
            cancelTokenHash,
        });
        expect(await cancelEscrowHoldByCancelToken(hold._id, 'b'.repeat(64))).toBeNull();
        const cancelled = await cancelEscrowHoldByCancelToken(hold._id, cancelTokenHash);
        expect(cancelled).toMatchObject({ status: 'cancelled', cancelledBy: 'link' });
        expect(cancelled?.cancelTokenUsedAt).toBeInstanceOf(Date);
        expect(cancelled?.cancelReason).toBeUndefined();
        // Burned: the hash still matches, but cancelTokenUsedAt no longer $exists-fails the filter.
        expect(await cancelEscrowHoldByCancelToken(hold._id, cancelTokenHash)).toBeNull();
        // A pending hold with no cancelTokenHash at all never matches an exact-hash filter.
        const noToken = await createHold();
        expect(await cancelEscrowHoldByCancelToken(noToken._id, cancelTokenHash)).toBeNull();
    });
    it('records notifications by appending to the array without disturbing other fields', async () => {
        const hold = await createHold();
        await recordEscrowHoldNotification(hold._id, 'started');
        let stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications).toHaveLength(1);
        expect(stored?.notifications[0]).toMatchObject({ kind: 'started' });
        expect(stored?.notifications[0].sentAt).toBeInstanceOf(Date);
        expect(stored?.status).toBe('pending');
        await recordEscrowHoldNotification(hold._id, 'cancelled');
        stored = await findEscrowHoldById(hold._id);
        expect(stored?.notifications.map(entry => entry.kind)).toEqual(['started', 'cancelled']);
        // A missing hold id is a no-op, never a throw.
        await expect(
            recordEscrowHoldNotification('does-not-exist', 'completed')
        ).resolves.toBeUndefined();
    });
    it('rotates the cancel token only for pending holds, leaving terminal holds untouched', async () => {
        const originalHash = 'a'.repeat(64);
        const hold = await createEscrowHold({
            holdRecord: {
                hold: {
                    holdId: randomUUID(),
                    did: 'did:key:test',
                    shareVersion: 1,
                    blobHash: 'ab'.repeat(32),
                    enrollmentEpoch: 1,
                    releasePolicy: 'hold',
                    clientEphemeralPublicKey: 'public-key',
                    createdLo: 0,
                    createdHi: 0,
                    policyVersion: 1,
                    signature: 'test-signature',
                },
                holdDurationMs: 0,
                ledgerSeq: 0,
            },
            authProvider: provider,
            primaryDid: 'did:key:test',
            shareVersion: 1,
            identityProofType: 'auth-token',
            requestedAt: new Date(),
            releaseAfter: new Date(),
            releasePolicy: 'hold',
            clientEphemeralPublicKey: 'public-key',
            resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
            cancelTokenHash: originalHash,
        });

        const token = await rotateEscrowCancelToken(hold._id);
        expect(token).toMatch(/^[0-9a-f]{64}$/);
        const rotated = await findEscrowHoldById(hold._id);
        expect(rotated?.cancelTokenHash).toMatch(/^[0-9a-f]{64}$/);
        expect(rotated?.cancelTokenHash).not.toBe(originalHash);

        // Cancelling burns the pending-only precondition: further rotation is a no-op.
        const cancelled = await cancelEscrowHold(hold._id, 'did');
        const hashAfterCancel = cancelled?.cancelTokenHash;
        expect(await rotateEscrowCancelToken(hold._id)).toBeNull();
        expect((await findEscrowHoldById(hold._id))?.cancelTokenHash).toBe(hashAfterCancel);

        const completedHold = await createHold();
        await completeEscrowHold(completedHold._id);
        expect(await rotateEscrowCancelToken(completedHold._id)).toBeNull();
        expect((await findEscrowHoldById(completedHold._id))?.cancelTokenHash).toBeUndefined();

        expect(await rotateEscrowCancelToken('does-not-exist')).toBeNull();
    });
    it('finds only pending hold-policy holds due within 24h and claims each at most once', async () => {
        const now = new Date();
        const hour = 60 * 60 * 1000;
        // Each candidate needs its own authProvider: the partial unique index
        // allows only one pending hold-policy hold per (authProvider, policy).
        const createHoldFor = (releaseAfter: Date, releasePolicy: 'hold' | 'pin' = 'hold') =>
            createEscrowHold({
                holdRecord: {
                    hold: {
                        holdId: randomUUID(),
                        did: 'did:key:test',
                        shareVersion: 1,
                        blobHash: 'ab'.repeat(32),
                        enrollmentEpoch: 1,
                        releasePolicy: 'hold',
                        clientEphemeralPublicKey: 'public-key',
                        createdLo: 0,
                        createdHi: 0,
                        policyVersion: 1,
                        signature: 'test-signature',
                    },
                    holdDurationMs: 0,
                    ledgerSeq: 0,
                },
                authProvider: { type: 'firebase', id: `escrow-reminder-${randomUUID()}` },
                primaryDid: 'did:key:test',
                shareVersion: 1,
                identityProofType: 'auth-token',
                requestedAt: new Date(),
                releaseAfter,
                releasePolicy,
                clientEphemeralPublicKey: 'public-key',
                resumeTokenHash: hashEscrowResumeToken(generateEscrowResumeToken()),
            });

        const dueSoon = await createHoldFor(new Date(now.getTime() + 23 * hour));
        const dueLate = await createHoldFor(new Date(now.getTime() + 25 * hour));
        const alreadyReminded = await createHoldFor(new Date(now.getTime() + hour));
        await recordEscrowHoldNotification(alreadyReminded._id, 'reminder');
        const pinHold = await createHoldFor(now, 'pin');
        const completedHold = await createHoldFor(new Date(now.getTime() + 2 * hour));
        await completeEscrowHold(completedHold._id);

        const due = await findEscrowHoldsDueForReminder(now, 200);
        const dueIds = due.map(hold => hold._id);
        expect(dueIds).toContain(dueSoon._id);
        expect(dueIds).not.toContain(dueLate._id);
        expect(dueIds).not.toContain(alreadyReminded._id);
        expect(dueIds).not.toContain(pinHold._id);
        expect(dueIds).not.toContain(completedHold._id);

        // Two concurrent claims for the same hold: MongoDB serializes the
        // findOneAndUpdate CAS, so exactly one observes the pre-push state.
        const [first, second] = await Promise.all([
            claimEscrowHoldForReminder(dueSoon._id, now),
            claimEscrowHoldForReminder(dueSoon._id, now),
        ]);
        const winners = [first, second].filter((claim): claim is EscrowHold => claim !== null);
        expect(winners).toHaveLength(1);
        expect(winners[0]?.notifications.filter(entry => entry.kind === 'reminder')).toHaveLength(
            1
        );
        expect(await claimEscrowHoldForReminder(dueSoon._id, now)).toBeNull();
    });
});
