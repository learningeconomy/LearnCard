import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
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
import { createRecoverySession, consumeRecoverySession } from '@cache/recoverySessions';
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
            expect((await findEscrowHoldById(next.holdId))?.status).toBe('completed');
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
