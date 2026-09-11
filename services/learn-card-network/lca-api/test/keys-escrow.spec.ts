import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac, randomUUID } from 'crypto';
import { redactSecretFields } from '../src/routes';
import cache from '@cache';
import * as models from '@models';
import {
    ESCROW_PIN_UNAVAILABLE_MESSAGE,
    ESCROW_PIN_MISMATCH_PATTERN,
    escrowPinMismatchMessage,
} from '@learncard/types';
import { generateOpenApiDocument } from 'trpc-to-openapi';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
    splitPrivateKey,
    reconstructFromShares,
    type EscrowEnvelope,
} from '@learncard/sss-key-manager';
import { client } from '@mongo';
import { environment } from '@environment';
import {
    createRecoverySession,
    consumeRecoverySession,
    storeRecoveryOtp,
} from '@cache/recoverySessions';
import { encryptAuthShare } from '@helpers/shareEncryption.helpers';
import {
    createUserKeysIndexes,
    getUserKeysCollection,
    findUserKeyByAuthProvider,
    upsertUserKeyByAuthProvider,
    addRecoveryMethodToUserKeyByAuthProvider,
    getEscrowHoldsCollection,
    findEscrowHoldById,
    hashEscrowResumeToken,
    type AuthProviderMapping,
} from '@models';
import { appRouter } from '../src/app';
import {
    __setEscrowEnclaveForTests,
    getEscrowEnclave,
    EscrowPolicyError,
    EscrowBlobError,
    EscrowPinMismatchError,
    EscrowUnavailableError,
} from '../src/services/escrow-enclave';
import { getClient, getUser } from './helpers/getClient';

const makeMockToken = (email: string, uid: string): string =>
    `header.${Buffer.from(JSON.stringify({ sub: uid, email })).toString('base64url')}.signature`;
const keyId = 'escrow-route-test';
const pk = 'b'.repeat(64);
let enclaveKeys: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let recipient: Awaited<ReturnType<typeof generateEscrowKeyPair>>;
let shares: Awaited<ReturnType<typeof splitPrivateKey>>;
let did: string;
let authProvider: AuthProviderMapping;
let auth: { authToken: string; providerType: 'firebase' };
let envelope: EscrowEnvelope;
const owner = () => getClient({ did, isChallengeValid: true });
const record = () => findUserKeyByAuthProvider(authProvider.type, authProvider.id);
const enroll = () =>
    owner().escrow.enroll({ ...auth, envelope, shareVersion: 1, enclaveKeyId: keyId });
const start = () =>
    getClient().escrow.startRecovery({ ...auth, clientEphemeralPublicKey: recipient.publicKey });
const resume = (hold: { holdId: string; resumeToken: string | null }) => {
    if (!hold.resumeToken) throw new Error('Expected a new recovery request');
    return { holdId: hold.holdId, resumeToken: hold.resumeToken };
};
const setDuration = (ms: number): void => {
    process.env.ESCROW_HOLD_DURATION_MS = String(ms);
    __setEscrowEnclaveForTests(undefined);
};

beforeAll(async () => {
    process.env.IS_E2E_TEST = 'true';
    process.env.SEED ||= 'a'.repeat(64);
    enclaveKeys = await generateEscrowKeyPair();
    recipient = await generateEscrowKeyPair();
    shares = await splitPrivateKey(pk);
    did = (await getUser(pk)).learnCard.id.did();
    process.env.ESCROW_ENCLAVE_MODE = 'software';
    process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON = JSON.stringify({
        [keyId]: enclaveKeys.privateKey,
    });
    process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID = keyId;
    // The factory seam refreshes the import-time environment snapshot as well as
    // the singleton; the real env-configured software backend is used throughout.
    setDuration(60_000);
    await client.connect();
    await createUserKeysIndexes();
});

beforeEach(async () => {
    const redis = cache.redis ?? cache.node;
    await redis.del('escrow:pin-complete:unknown');
    await redis.del('escrow:pin-start:unknown');
    setDuration(60_000);
    authProvider = { type: 'firebase', id: `escrow-route-${randomUUID()}` };
    const email = `${authProvider.id}@example.com`;
    auth = { authToken: makeMockToken(email, authProvider.id), providerType: 'firebase' };
    await upsertUserKeyByAuthProvider({ type: 'email', value: email }, authProvider, {
        primaryDid: did,
        authShare: encryptAuthShare(
            { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
            environment.SEED
        ),
    });
    envelope = await encryptEscrowBlob(
        { recoveryShare: shares.recoveryShare, did, shareVersion: 1 },
        enclaveKeys.publicKey,
        keyId
    );
});

afterEach(async () => {
    vi.restoreAllMocks();
    await getUserKeysCollection().deleteMany({ 'authProviders.id': authProvider.id });
    await getEscrowHoldsCollection().deleteMany({ 'authProvider.id': authProvider.id });
});

afterAll(async () => {
    delete process.env.ESCROW_ENCLAVE_MODE;
    delete process.env.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON;
    delete process.env.ESCROW_ENCLAVE_ACTIVE_KEY_ID;
    delete process.env.ESCROW_HOLD_DURATION_MS;
    __setEscrowEnclaveForTests(undefined);
    await client.close();
});

describe('A6 escrow recovery', () => {
    it('1: exposes the configured software attestation and exact OpenAPI routes', async () => {
        const result = await getClient().escrow.getAttestation({});
        expect(result.attestation.mode).toBe('software');
        expect(result.attestation.publicKey === enclaveKeys.publicKey).toBe(true);
        expect(result.holdDurationMs).toBe(60_000);
        const document = generateOpenApiDocument(appRouter, {
            title: 'Test',
            version: '1',
            baseUrl: 'https://example.com',
        });
        for (const [path, method] of [
            ['/keys/escrow/attestation', 'get'],
            ['/keys/escrow', 'post'],
            ['/keys/escrow', 'delete'],
            ['/keys/escrow/opt-in', 'post'],
            ['/keys/escrow/recover', 'post'],
            ['/keys/escrow/status', 'get'],
            ['/keys/escrow/cancel', 'post'],
            ['/keys/escrow/complete', 'post'],
        ] as const)
            expect(document.paths?.[path]?.[method]).toBeDefined();
    });

    it('2: stores the verified blob and a confirmed version-matched descriptor atomically', async () => {
        await expect(enroll()).resolves.toEqual({ success: true, shareVersion: 1 });
        const stored = await record();
        expect(stored?.recoveryMethods).toEqual([
            expect.objectContaining({
                type: 'escrow',
                confirmationStatus: 'confirmed',
                confirmedAt: expect.any(Date),
                shareVersion: 1,
            }),
        ]);
        expect(JSON.stringify(stored?.escrowBlob?.envelope) === JSON.stringify(envelope)).toBe(
            true
        );
        await expect(owner().keys.getRecoveryShare({ ...auth, type: 'escrow' })).resolves.toEqual({
            shareVersion: 1,
        });
    });

    it('3: rejects wrong owners, stale versions, embedded mismatches, key IDs, tampering and opt-out', async () => {
        const input = { ...auth, envelope, shareVersion: 1, enclaveKeyId: keyId };
        await expect(
            getClient({ did: 'did:key:other', isChallengeValid: true }).escrow.enroll(input)
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(owner().escrow.enroll({ ...input, shareVersion: 2 })).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        for (const overrides of [{ did: 'did:key:other' }, { shareVersion: 2 }]) {
            const bad = await encryptEscrowBlob(
                { did, shareVersion: 1, recoveryShare: shares.recoveryShare, ...overrides },
                enclaveKeys.publicKey,
                keyId
            );
            await expect(owner().escrow.enroll({ ...input, envelope: bad })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        }
        await expect(
            owner().escrow.enroll({ ...input, enclaveKeyId: 'unknown' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            owner().escrow.enroll({ ...input, envelope: { ...envelope, keyId: 'unknown' } })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            owner().escrow.enroll({ ...input, envelope: { ...envelope, ciphertext: 'invalid' } })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Invalid automatic recovery material.',
        });
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { escrowOptedOutAt: new Date() } }
        );
        expect((await owner().keys.getAuthShare(auth))?.escrowOptedOut).toBe(true);
        await expect(enroll()).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'Automatic recovery is turned off for this account.',
        });
        expect((await record())?.escrowBlob).toBeUndefined();
    });

    it('4: creates one pending hold and never resets its clock or replaces its recipient key', async () => {
        await enroll();
        const first = await start();
        const another = await generateEscrowKeyPair();
        const second = await getClient().escrow.startRecovery({
            ...auth,
            clientEphemeralPublicKey: another.publicKey,
        });
        expect(second).toEqual({ ...first, resumeToken: null });
        const stored = await findEscrowHoldById(first.holdId);
        expect(stored?.clientEphemeralPublicKey === recipient.publicKey).toBe(true);
        expect(stored?.resumeTokenHash === hashEscrowResumeToken(resume(first).resumeToken)).toBe(
            true
        );
        expect(stored?.identityProofType).toBe('auth-token');
    });

    it('4: handles simultaneous starts through the partial unique index', async () => {
        await enroll();
        const results = await Promise.all([start(), start(), start()]);
        expect(new Set(results.map(result => result.holdId)).size).toBe(1);
        expect(results.filter(result => result.resumeToken !== null)).toHaveLength(1);
    });

    it('5: accepts one-use recover sessions and hides invalid or unavailable identities', async () => {
        await enroll();
        const recoverySessionToken = await createRecoverySession({
            scope: 'recover',
            authProvider,
        });
        const started = await getClient().escrow.startRecovery({
            recoverySessionToken,
            clientEphemeralPublicKey: recipient.publicKey,
        });
        expect((await findEscrowHoldById(started.holdId))?.identityProofType).toBe(
            'recovery-session'
        );
        const unavailable = {
            code: 'NOT_FOUND',
            message: 'Automatic recovery is not available for this account.',
        };
        await expect(
            getClient().escrow.startRecovery({
                recoverySessionToken,
                clientEphemeralPublicKey: recipient.publicKey,
            })
        ).rejects.toMatchObject(unavailable);
        const missingSession = await createRecoverySession({
            scope: 'recover',
            authProvider: { type: 'firebase', id: randomUUID() },
        });
        await expect(
            getClient().escrow.startRecovery({
                recoverySessionToken: missingSession,
                clientEphemeralPublicKey: recipient.publicKey,
            })
        ).rejects.toMatchObject(unavailable);
        await owner().escrow.remove({ ...auth, optOut: false });
        await expect(start()).rejects.toMatchObject(unavailable);
    });

    it('6: supports header-based active-device status, token status, cancellation and idempotency', async () => {
        await enroll();
        const started = await start();
        const active = appRouter.createCaller({
            domain: 'example.com',
            providerToken: auth.authToken,
            tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
        });
        const status = await active.escrow.getStatus({ providerType: 'firebase' });
        expect(status.hold).toEqual({
            holdId: started.holdId,
            status: 'pending',
            requestedAt: started.requestedAt,
            releaseAfter: started.releaseAfter,
            releasePolicy: 'hold',
        });
        await expect(getClient().escrow.getStatus(resume(started))).resolves.toEqual(status);
        const viaHeader = appRouter.createCaller({
            domain: 'example.com',
            providerToken: resume(started).resumeToken,
            tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
        });
        await expect(viaHeader.escrow.getStatus({ holdId: started.holdId })).resolves.toEqual(
            status
        );
        await expect(getClient().escrow.getStatus({ holdId: started.holdId })).resolves.toEqual({
            hold: null,
        });
        await expect(
            getClient().escrow.getStatus({ holdId: started.holdId, resumeToken: 'wrong' })
        ).resolves.toEqual({ hold: null });
        await expect(
            getClient().escrow.getStatus({ holdId: randomUUID(), resumeToken: 'wrong' })
        ).resolves.toEqual({ hold: null });
        await expect(
            getClient({ did: 'did:key:other', isChallengeValid: true }).escrow.cancelRecovery(auth)
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(owner().escrow.cancelRecovery(auth)).resolves.toEqual({
            success: true,
            cancelled: true,
        });
        await expect(owner().escrow.cancelRecovery(auth)).resolves.toEqual({
            success: true,
            cancelled: false,
        });
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'This recovery request was cancelled.',
        });
        expect(
            (await getClient().escrow.getStatus(resume(started))).hold?.cancelledAt
        ).toBeDefined();
    });

    it('7: independently enforces waiting periods in the route and the software enclave', async () => {
        await enroll();
        const started = await start();
        const enclave = getEscrowEnclave();
        const release = vi.spyOn(enclave, 'releaseEscrow');
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'This recovery request is still in its waiting period.',
        });
        expect(release).not.toHaveBeenCalled();
        const hold = await findEscrowHoldById(started.holdId);
        if (!hold) throw new Error('Missing test hold');
        await expect(
            enclave.releaseEscrow({
                envelope,
                hold,
                expectedDid: did,
                clientEphemeralPublicKey: recipient.publicKey,
                now: new Date(hold.releaseAfter.getTime() - 1),
            })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
        await expect(
            enclave.releaseEscrow({
                envelope,
                hold,
                expectedDid: did,
                clientEphemeralPublicKey: enclaveKeys.publicKey,
                now: hold.releaseAfter,
            })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
    });

    it('8: releases once after the hold, reconstructs the original private key and issues a rebind session', async () => {
        setDuration(1);
        await enroll();
        const started = await start();
        await new Promise(resolve => setTimeout(resolve, 5));
        const recovered = await getClient().escrow.completeRecovery(resume(started));
        const opened = await openEscrowRelease(recovered.sealedShare, recipient.privateKey);
        expect(opened.did).toBe(did);
        expect(opened.holdId).toBe(started.holdId);
        expect(opened.shareVersion).toBe(1);
        expect(
            (await reconstructFromShares([
                opened.recoveryShare,
                recovered.authShare.encryptedData,
            ])) === pk
        ).toBe(true);
        expect((await findEscrowHoldById(started.holdId))?.status).toBe('completed');
        expect(await consumeRecoverySession(recovered.rebindSessionToken, 'rebind')).toMatchObject({
            authProvider,
        });
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });

    it('8: concurrent completions invoke the enclave only once and failures burn the claimed hold', async () => {
        setDuration(1);
        await enroll();
        const started = await start();
        await new Promise(resolve => setTimeout(resolve, 5));
        const release = vi.spyOn(getEscrowEnclave(), 'releaseEscrow');
        const results = await Promise.allSettled([
            getClient().escrow.completeRecovery(resume(started)),
            getClient().escrow.completeRecovery(resume(started)),
        ]);
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(release).toHaveBeenCalledTimes(1);
        for (const error of [new EscrowBlobError(), new EscrowPolicyError()]) {
            const next = await start();
            await new Promise(resolve => setTimeout(resolve, 5));
            release.mockRejectedValueOnce(error);
            await expect(getClient().escrow.completeRecovery(resume(next))).rejects.toMatchObject({
                code: error instanceof EscrowBlobError ? 'INTERNAL_SERVER_ERROR' : 'FORBIDDEN',
            });
            expect(await findEscrowHoldById(next.holdId)).toMatchObject({
                status: 'cancelled',
                cancelReason: 'release-failed',
            });
        }
    });

    it('9: requires another current confirmed method to opt out, cancels holds, and allows explicit opt-in', async () => {
        await enroll();
        const started = await start();
        for (const method of [
            undefined,
            { shareVersion: 1, confirmationStatus: 'pending' as const },
            { shareVersion: 2, confirmedAt: new Date() },
        ]) {
            if (method)
                await addRecoveryMethodToUserKeyByAuthProvider(authProvider, {
                    type: 'backup',
                    createdAt: new Date(),
                    ...method,
                });
            await expect(owner().escrow.remove({ ...auth, optOut: true })).rejects.toMatchObject({
                code: 'PRECONDITION_FAILED',
                message: 'Set up another recovery method before turning off automatic recovery.',
            });
        }
        await addRecoveryMethodToUserKeyByAuthProvider(authProvider, {
            type: 'backup',
            createdAt: new Date(),
            confirmedAt: new Date(),
            shareVersion: 1,
        });
        await expect(owner().escrow.remove({ ...auth, optOut: true })).resolves.toEqual({
            success: true,
        });
        expect((await record())?.escrowOptedOutAt).toBeInstanceOf(Date);
        expect((await record())?.escrowBlob).toBeUndefined();
        expect((await findEscrowHoldById(started.holdId))?.status).toBe('cancelled');
        await expect(enroll()).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(start()).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await owner().escrow.optIn(auth);
        await expect(enroll()).resolves.toEqual({ success: true, shareVersion: 1 });
    });

    it('10: blocks bypassing escrow enrollment, confirmation, deletion and recovery', async () => {
        await expect(
            owner().keys.addRecoveryMethod({ ...auth, type: 'escrow' })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Use the automatic recovery enrollment endpoint.',
        });
        await expect(
            owner().keys.confirmRecoveryMethod({ ...auth, type: 'escrow' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await expect(
            owner().keys.deleteRecoveryMethod({ ...auth, type: 'escrow' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        const recoverySessionToken = await createRecoverySession({
            scope: 'recover',
            authProvider,
        });
        await expect(
            getClient().keys.useRecoverySession({ recoverySessionToken, type: 'escrow' })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: 'Use /keys/escrow/recover for automatic recovery.',
        });
    });

    it('11: disables every procedure before DID authorization when the mode is unset', async () => {
        delete process.env.ESCROW_ENCLAVE_MODE;
        __setEscrowEnclaveForTests(undefined);
        try {
            const caller = getClient().escrow;
            const actions = [
                () => caller.getAttestation({}),
                () => caller.enroll({ ...auth, envelope, shareVersion: 1, enclaveKeyId: keyId }),
                () => caller.remove({ ...auth, optOut: false }),
                () => caller.optIn(auth),
                () =>
                    caller.startRecovery({
                        ...auth,
                        clientEphemeralPublicKey: recipient.publicKey,
                    }),
                () => caller.getStatus(auth),
                () => caller.cancelRecovery(auth),
                () => caller.completeRecovery({ holdId: randomUUID(), resumeToken: 'invalid' }),
            ];
            for (const action of actions)
                await expect(action()).rejects.toMatchObject({
                    code: 'PRECONDITION_FAILED',
                    message: 'Escrow recovery is not available.',
                });
        } finally {
            process.env.ESCROW_ENCLAVE_MODE = 'software';
            __setEscrowEnclaveForTests(undefined);
        }
    });

    it('rejects invalid tokens and removed, unconfirmed, replaced or expired recovery material', async () => {
        setDuration(1);
        await enroll();
        const started = await start();
        await new Promise(resolve => setTimeout(resolve, 5));
        for (const holdId of [started.holdId, randomUUID()]) {
            await expect(
                getClient().escrow.completeRecovery({ holdId, resumeToken: 'wrong' })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'This recovery request is invalid.',
            });
        }
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            {
                $set: { 'escrowBlob.shareVersion': 2 },
            }
        );
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await enroll();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { recoveryMethods: [] } }
        );
        await expect(start()).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        await enroll();
        await getEscrowHoldsCollection().updateOne(
            { _id: started.holdId },
            {
                $set: { releaseAfter: new Date(Date.now() - 31 * 86_400_000) },
            }
        );
        expect((await getClient().escrow.getStatus(resume(started))).hold?.status).toBe('expired');
        await expect(getClient().escrow.completeRecovery(resume(started))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });
});

describe('escrow PIN release', () => {
    const pinProof = 'ab'.repeat(32);
    const wrongProof = 'cd'.repeat(32);
    const pinSalt = Buffer.alloc(16, 7).toString('base64');
    const enrollPin = async () => {
        envelope = await encryptEscrowBlob(
            { recoveryShare: shares.recoveryShare, did, shareVersion: 1, pinVerifier: pinProof },
            enclaveKeys.publicKey,
            keyId
        );
        return owner().escrow.enroll({
            ...auth,
            envelope,
            shareVersion: 1,
            enclaveKeyId: keyId,
            pinSalt,
        });
    };
    const startPin = () =>
        getClient().escrow.startRecovery({
            ...auth,
            clientEphemeralPublicKey: recipient.publicKey,
            releasePolicy: 'pin',
        });
    const completePin = (hold: Parameters<typeof resume>[0], proof = pinProof) =>
        getClient().escrow.completeRecovery({ ...resume(hold), pinProof: proof });

    it('rejects mismatched verifier/salt enrollment and invalid salts', async () => {
        await expect(
            owner().escrow.enroll({
                ...auth,
                envelope,
                shareVersion: 1,
                enclaveKeyId: keyId,
                pinSalt,
            })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        await enrollPin();
        await expect(enroll()).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        for (const salt of ['invalid', Buffer.alloc(15).toString('base64'), '!'.repeat(24)]) {
            await expect(
                owner().escrow.enroll({
                    ...auth,
                    envelope,
                    shareVersion: 1,
                    enclaveKeyId: keyId,
                    pinSalt: salt,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        }
        expect((await record())?.escrowPin).toMatchObject({
            salt: pinSalt,
            failedAttempts: 0,
            shareVersion: 1,
        });
    });

    it('releases immediately with the correct PIN and resets attempts', async () => {
        await enrollPin();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.failedAttempts': 3 } }
        );
        const before = Date.now();
        const hold = await startPin();
        expect(hold.releasePolicy).toBe('pin');
        expect(hold.pinSalt).toBe(pinSalt);
        expect(Date.parse(hold.releaseAfter)).toBeGreaterThanOrEqual(before);
        expect(Date.parse(hold.releaseAfter)).toBeLessThanOrEqual(Date.now());
        expect((await getClient().escrow.getStatus(resume(hold))).hold?.releasePolicy).toBe('pin');
        const result = await completePin(hold);
        const opened = await openEscrowRelease(result.sealedShare, recipient.privateKey);
        expect(opened.holdId).toBe(hold.holdId);
        expect(opened.pinVerifier).toBeUndefined();
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        expect((await findEscrowHoldById(hold.holdId))?.status).toBe('completed');
    });

    it('burns a mismatched hold; a new hold with the correct PIN succeeds', async () => {
        await enrollPin();
        const first = await startPin();
        await expect(completePin(first, wrongProof)).rejects.toMatchObject({
            code: 'FORBIDDEN',
            message: 'Incorrect PIN. 9 attempts left.',
        });
        expect(await findEscrowHoldById(first.holdId)).toMatchObject({
            status: 'cancelled',
            cancelledBy: 'system',
            cancelReason: 'pin-mismatch',
        });
        await expect(completePin(first)).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await record())?.escrowPin?.failedAttempts).toBe(1);
        const second = await startPin();
        expect(second.holdId).not.toBe(first.holdId);
        await completePin(second);
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
    });

    it('locks after ten mismatches and still permits delayed recovery', async () => {
        await enrollPin();
        for (let attempt = 1; attempt <= 10; attempt++) {
            const hold = await startPin();
            await expect(completePin(hold, wrongProof)).rejects.toMatchObject({
                code: attempt === 10 ? 'TOO_MANY_REQUESTS' : 'FORBIDDEN',
                message:
                    attempt === 10
                        ? 'Too many incorrect PIN attempts. You can still recover by waiting.'
                        : `Incorrect PIN. ${10 - attempt} attempts left.`,
            });
            expect(await findEscrowHoldById(hold.holdId)).toMatchObject({
                status: 'cancelled',
                cancelledBy: 'system',
                cancelReason: attempt === 10 ? 'pin-locked' : 'pin-mismatch',
            });
        }
        expect((await record())?.escrowPin).toMatchObject({
            failedAttempts: 10,
            disabledAt: expect.any(Date),
        });
        await expect(startPin()).rejects.toMatchObject({ code: 'FORBIDDEN' });
        const fallback = await start();
        expect(fallback.releasePolicy).toBe('hold');
        expect(fallback).not.toHaveProperty('pinSalt');
    });

    it('uses a distinct IP throttle message without consuming a PIN attempt', async () => {
        await enrollPin();
        const hold = await startPin();
        const redis = cache.redis ?? cache.node;
        await redis.set('escrow:pin-complete:unknown', '20');
        await expect(completePin(hold)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Please wait before trying again.',
        });
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        expect((await findEscrowHoldById(hold.holdId))?.status).toBe('pending');
    });

    it('refunds the tenth reservation when proof is missing without locking the PIN', async () => {
        await enrollPin();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.failedAttempts': 9 } }
        );
        const hold = await startPin();
        await expect(getClient().escrow.completeRecovery(resume(hold))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        expect(await findEscrowHoldById(hold.holdId)).toMatchObject({
            status: 'cancelled',
            cancelledBy: 'system',
            cancelReason: 'release-failed',
        });
        expect((await record())?.escrowPin?.disabledAt).toBeUndefined();
        expect((await record())?.escrowPin?.failedAttempts).toBe(9);
    });

    it('cancels a pending PIN hold as pin-locked when no reservation remains', async () => {
        await enrollPin();
        const hold = await startPin();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.failedAttempts': 10 } }
        );
        const release = vi.spyOn(getEscrowEnclave(), 'releaseEscrow');
        await expect(completePin(hold)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(release).not.toHaveBeenCalled();
        expect(await findEscrowHoldById(hold.holdId)).toMatchObject({
            status: 'cancelled',
            cancelReason: 'pin-locked',
            cancelledBy: 'system',
        });
        expect((await record())?.escrowPin?.disabledAt).toBeInstanceOf(Date);
    });

    it('preserves the waiting hold while superseding only pending PIN requests', async () => {
        await enrollPin();
        const first = await start();
        const second = await startPin();
        const third = await startPin();
        const fourth = await start();
        expect(fourth).toEqual({ ...first, resumeToken: null });
        expect(await findEscrowHoldById(second.holdId)).toMatchObject({
            status: 'cancelled',
            cancelReason: 'superseded',
            cancelledBy: 'system',
        });
        expect(second.resumeToken).toBeTruthy();
        expect(third.resumeToken).toBeTruthy();
        expect(await findEscrowHoldById(first.holdId)).toMatchObject({
            status: 'pending',
            releaseAfter: new Date(first.releaseAfter),
        });
        expect(await findEscrowHoldById(third.holdId)).toMatchObject({ status: 'pending' });
        expect((await getClient().escrow.getStatus(auth)).hold?.holdId).toBe(first.holdId);
        await expect(getClient().escrow.cancelRecovery(auth)).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(await start()).toEqual({ ...fourth, resumeToken: null });
        await owner().escrow.cancelRecovery(auth);
        expect((await findEscrowHoldById(first.holdId))?.status).toBe('cancelled');
        expect((await findEscrowHoldById(third.holdId))?.status).toBe('pending');
    });

    it('starts a waiting hold alongside a stale pending PIN hold', async () => {
        await enrollPin();
        const pin = await startPin();
        const hold = await start();
        expect(hold.releasePolicy).toBe('hold');
        expect(hold.resumeToken).toBeTruthy();
        expect((await findEscrowHoldById(pin.holdId))?.status).toBe('pending');
        expect((await getClient().escrow.getStatus(auth)).hold?.holdId).toBe(hold.holdId);
    });

    it.each([new EscrowUnavailableError(), new EscrowBlobError()])(
        'refunds non-mismatch enclave failures: %s',
        async error => {
            await enrollPin();
            await getUserKeysCollection().updateOne(
                { 'authProviders.id': authProvider.id },
                { $set: { 'escrowPin.failedAttempts': 9 } }
            );
            const hold = await startPin();
            vi.spyOn(getEscrowEnclave(), 'releaseEscrow').mockRejectedValueOnce(error);
            await expect(completePin(hold)).rejects.toMatchObject({
                code:
                    error instanceof EscrowUnavailableError
                        ? 'PRECONDITION_FAILED'
                        : 'INTERNAL_SERVER_ERROR',
            });
            expect((await record())?.escrowPin).toMatchObject({ failedAttempts: 9 });
            expect((await record())?.escrowPin?.disabledAt).toBeUndefined();
            expect(await findEscrowHoldById(hold.holdId)).toMatchObject({
                status: 'cancelled',
                cancelReason: 'release-failed',
            });
        }
    );

    it('refunds a reservation when the hold claim loses a race', async () => {
        await enrollPin();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.failedAttempts': 9 } }
        );
        const hold = await startPin();
        vi.spyOn(models, 'completeEscrowHold').mockImplementationOnce(async id => {
            await models.cancelEscrowHold(id, 'did');
            return null;
        });
        const release = vi.spyOn(getEscrowEnclave(), 'releaseEscrow');
        await expect(completePin(hold)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(release).not.toHaveBeenCalled();
        expect((await record())?.escrowPin?.failedAttempts).toBe(9);
        expect((await record())?.escrowPin?.disabledAt).toBeUndefined();
    });

    it.each(['disabled', 'cleared', 'version', 'ciphertext'] as const)(
        'returns unavailable rather than lockout for concurrent PIN changes: %s',
        async change => {
            await enrollPin();
            const hold = await startPin();
            const reserve = models.reserveEscrowPinAttempt;
            vi.spyOn(models, 'reserveEscrowPinAttempt').mockImplementationOnce(async (...args) => {
                await getUserKeysCollection().updateOne(
                    { 'authProviders.id': authProvider.id },
                    change === 'cleared'
                        ? { $unset: { escrowPin: '' } }
                        : change === 'disabled'
                          ? { $set: { 'escrowPin.disabledAt': new Date() } }
                          : change === 'version'
                            ? { $set: { shareVersion: 2 } }
                            : { $set: { 'escrowBlob.envelope.ciphertext': 'replacement' } }
                );
                return reserve(...args);
            });
            const disable = vi.spyOn(models, 'disableEscrowPin');
            await expect(completePin(hold)).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: ESCROW_PIN_UNAVAILABLE_MESSAGE,
            });
            expect(disable).not.toHaveBeenCalled();
            expect((await findEscrowHoldById(hold.holdId))?.status).toBe('pending');
        }
    );

    it('throttles PIN starts by IP without superseding holds or consuming attempts', async () => {
        await enrollPin();
        const hold = await startPin();
        const redis = cache.redis ?? cache.node;
        await redis.set('escrow:pin-start:unknown', '20', 'EX', 60);
        await expect(startPin()).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
            message: 'Please wait before trying again.',
        });
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        expect((await findEscrowHoldById(hold.holdId))?.status).toBe('pending');
        await expect(start()).resolves.toMatchObject({ releasePolicy: 'hold' });
        const otherIp = appRouter.createCaller({
            domain: 'example.com',
            clientIp: '192.0.2.1',
            tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
        });
        await redis.del('escrow:pin-start:192.0.2.1');
        await expect(
            otherIp.escrow.startRecovery({
                ...auth,
                clientEphemeralPublicKey: recipient.publicKey,
                releasePolicy: 'pin',
            })
        ).resolves.toMatchObject({ releasePolicy: 'pin' });
    });

    it('keeps the shared mismatch formatter compatible with the client pattern', () => {
        expect(ESCROW_PIN_MISMATCH_PATTERN.exec(escrowPinMismatchMessage(9))?.[1]).toBe('9');
    });

    it('clears PIN metadata when re-enrolled without a PIN or rotated', async () => {
        await enrollPin();
        envelope = await encryptEscrowBlob(
            { recoveryShare: shares.recoveryShare, did, shareVersion: 1 },
            enclaveKeys.publicKey,
            keyId
        );
        await enroll();
        expect((await record())?.escrowPin).toBeUndefined();
        await enrollPin();
        // Rotation retains recovery methods while their auth share is in the
        // five-entry history. Exercise the rotation that actually prunes escrow.
        for (let rotation = 0; rotation < 6; rotation++) {
            await owner().keys.storeAuthShare({
                ...auth,
                primaryDid: did,
                authShare: { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
            });
        }
        expect((await record())?.escrowBlob).toBeUndefined();
        expect((await record())?.escrowPin).toBeUndefined();
    });

    it('reports enabled, disabled, absent and stale PIN metadata without leaking salt when disabled', async () => {
        expect((await owner().keys.getAuthShare(auth))?.escrowPin).toEqual({
            enabled: false,
            attemptsRemaining: 0,
        });
        await enrollPin();
        expect((await owner().keys.getAuthShare(auth))?.escrowPin).toEqual({
            enabled: true,
            attemptsRemaining: 10,
            salt: pinSalt,
        });
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.failedAttempts': 10, 'escrowPin.disabledAt': new Date() } }
        );
        expect((await owner().keys.getAuthShare(auth))?.escrowPin).toEqual({
            enabled: false,
            attemptsRemaining: 0,
        });
        await enrollPin();
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $set: { 'escrowPin.shareVersion': 2 } }
        );
        expect((await owner().keys.getAuthShare(auth))?.escrowPin).toEqual({
            enabled: false,
            attemptsRemaining: 10,
        });
        await expect(startPin()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('atomically admits at most ten of fifteen concurrent wrong-PIN completions', async () => {
        await enrollPin();
        // Distinct linked identities allow 15 fresh pending holds while preserving the
        // unique pending-per-identity index. All aliases share ONE UserKey/counter.
        const aliases = Array.from({ length: 14 }, () => ({
            type: 'firebase' as const,
            id: randomUUID(),
        }));
        await getUserKeysCollection().updateOne(
            { 'authProviders.id': authProvider.id },
            { $push: { authProviders: { $each: aliases } } }
        );
        try {
            const holds = await Promise.all(
                [authProvider, ...aliases].map(provider =>
                    getClient().escrow.startRecovery({
                        authToken: makeMockToken(`${provider.id}@example.com`, provider.id),
                        providerType: 'firebase',
                        releasePolicy: 'pin',
                        clientEphemeralPublicKey: recipient.publicKey,
                    })
                )
            );
            const release = vi
                .spyOn(getEscrowEnclave(), 'releaseEscrow')
                .mockRejectedValue(new EscrowPinMismatchError());
            const results = await Promise.allSettled(
                holds.map(hold => completePin(hold, wrongProof))
            );
            expect(results.every(result => result.status === 'rejected')).toBe(true);
            // Lockout may cancel other pending holds before their CAS; never more
            // than ten reservations can reach the enclave across linked identities.
            expect(release.mock.calls.length).toBeGreaterThan(0);
            expect(release.mock.calls.length).toBeLessThanOrEqual(10);
            expect((await record())?.escrowPin).toMatchObject({
                failedAttempts: 10,
                disabledAt: expect.any(Date),
            });
        } finally {
            await getEscrowHoldsCollection().deleteMany({
                'authProvider.id': { $in: aliases.map(alias => alias.id) },
            });
        }
    });

    it('returns PIN status with recovery-session verification', async () => {
        await enrollPin();
        const email = `${authProvider.id}@example.com`;
        await storeRecoveryOtp(email, {
            authProvider,
            codeHash: createHmac('sha256', environment.SEED).update('123456').digest('hex'),
        });
        const result = await getClient().keys.verifyRecoverySession({ email, code: '123456' });
        expect(result.escrowPin).toEqual({ enabled: true, attemptsRemaining: 10, salt: pinSalt });
    });

    it('does not reserve on invalid tokens, and burns missing-proof releases fail-closed', async () => {
        await enrollPin();
        const hold = await startPin();
        await expect(
            getClient().escrow.completeRecovery({
                holdId: hold.holdId,
                resumeToken: 'wrong',
                pinProof,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        await expect(getClient().escrow.completeRecovery(resume(hold))).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        expect(await findEscrowHoldById(hold.holdId)).toMatchObject({
            status: 'cancelled',
            cancelReason: 'release-failed',
        });
    });

    it('limits PIN completions by IP before reserving or releasing and redacts PIN secrets', async () => {
        await enrollPin();
        const hold = await startPin();
        const redis = cache.redis ?? cache.node;
        await redis.set('escrow:pin-complete:unknown', '20', 'EX', 60);
        const release = vi.spyOn(getEscrowEnclave(), 'releaseEscrow');
        await expect(completePin(hold)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
        expect(release).not.toHaveBeenCalled();
        expect((await record())?.escrowPin?.failedAttempts).toBe(0);
        expect(redactSecretFields({ pinProof, nested: { pinVerifier: pinProof } })).toEqual({
            pinProof: '[Redacted]',
            nested: { pinVerifier: '[Redacted]' },
        });
    });
});
