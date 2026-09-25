import { describe, it, expect } from 'vitest';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
} from '@learncard/sss-key-manager';
import { SoftwareEnclave } from './softwareEnclave';
import {
    EscrowBlobError,
    EscrowPolicyError,
    EscrowPinMismatchError,
    type EscrowHoldRecord,
} from './types';

describe('software enclave', () => {
    it('derives the attestation key, verifies enrollment, and enforces release policy', async () => {
        const keys = await generateEscrowKeyPair();
        const client = await generateEscrowKeyPair();
        const enclave = new SoftwareEnclave({
            privateKeys: { test: keys.privateKey },
            activeKeyId: 'test',
        });
        const attestation = await enclave.getAttestation();
        expect(attestation.publicKey).toBe(keys.publicKey);
        expect(JSON.parse(Buffer.from(attestation.document, 'base64').toString())).toEqual({
            mode: 'software',
            keyId: 'test',
            publicKey: keys.publicKey,
            issuedAt: attestation.issuedAt,
        });
        const plaintext = { recoveryShare: 'ab'.repeat(33), did: 'did:key:test', shareVersion: 1 };
        const envelope = await encryptEscrowBlob(plaintext, attestation.publicKey, 'test');
        expect(
            await enclave.verifyEscrowBlob({
                envelope,
                expectedDid: plaintext.did,
                expectedShareVersion: 1,
            })
        ).toEqual({ ok: true, hasPin: false });
        expect(
            await enclave.verifyEscrowBlob({
                envelope,
                expectedDid: 'did:key:wrong',
                expectedShareVersion: 1,
            })
        ).toMatchObject({ ok: false });
        const { holdRecord: created } = await enclave.createHold({
            envelope,
            holdId: 'test-hold',
            expectedDid: plaintext.did,
            expectedShareVersion: 1,
            enrollmentEpoch: 1,
            releasePolicy: 'hold',
            clientEphemeralPublicKey: client.publicKey,
        });
        const hold: EscrowHoldRecord = {
            ...created,
            hold: { ...created.hold, createdLo: 0, createdHi: 0 },
            holdDurationMs: 1000,
        };
        expect(created).toMatchObject({
            hold: {
                holdId: 'test-hold',
                did: plaintext.did,
                shareVersion: 1,
                enrollmentEpoch: 1,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: client.publicKey,
                createdLo: expect.any(Number),
                createdHi: expect.any(Number),
                policyVersion: 1,
                signature: 'software-mode-unsigned',
                blobHash: expect.stringMatching(/^[0-9a-f]{64}$/),
            },
            holdDurationMs: 604800000,
            ledgerSeq: 0,
        });
        const createInput = {
            envelope,
            holdId: 'test-hold',
            expectedDid: plaintext.did,
            expectedShareVersion: 1,
            enrollmentEpoch: 1,
            releasePolicy: 'hold' as const,
            clientEphemeralPublicKey: client.publicKey,
        };
        for (const change of [
            { expectedDid: 'did:key:other' },
            { expectedShareVersion: 2 },
            { enrollmentEpoch: 0 },
            { releasePolicy: 'pin' as const },
        ]) {
            await expect(enclave.createHold({ ...createInput, ...change })).rejects.toBeInstanceOf(
                EscrowPolicyError
            );
        }
        await expect(
            enclave.createHold({ ...createInput, envelope: { ...envelope, ciphertext: 'bad' } })
        ).rejects.toBeInstanceOf(EscrowBlobError);
        const request = {
            envelope,
            hold,
            clientEphemeralPublicKey: client.publicKey,
            expectedDid: plaintext.did,
        };
        await expect(enclave.cancelHold(request)).resolves.toBeUndefined();
        for (const change of [
            { expectedDid: 'did:key:other' },
            { clientEphemeralPublicKey: keys.publicKey },
            { hold: { ...hold, hold: { ...hold.hold, did: 'did:key:other' } } },
        ]) {
            await expect(enclave.cancelHold({ ...request, ...change })).rejects.toBeInstanceOf(
                EscrowPolicyError
            );
        }
        await expect(
            enclave.cancelHold({ ...request, envelope: { ...envelope, ciphertext: 'bad' } })
        ).rejects.toBeInstanceOf(EscrowBlobError);
        await expect(
            enclave.releaseEscrow({ ...request, now: new Date(999) })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
        for (const changed of [{ shareVersion: 2 }, { did: 'did:key:wrong' }]) {
            await expect(
                enclave.releaseEscrow({
                    ...request,
                    hold: { ...hold, hold: { ...hold.hold, ...changed } },
                    now: new Date(1000),
                })
            ).rejects.toBeInstanceOf(EscrowPolicyError);
        }
        await expect(
            enclave.releaseEscrow({ ...request, expectedDid: 'did:key:wrong', now: new Date(1000) })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
        await expect(
            enclave.releaseEscrow({
                ...request,
                clientEphemeralPublicKey: keys.publicKey,
                now: new Date(1000),
            })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
        const released = await enclave.releaseEscrow({ ...request, now: new Date(1000) });
        expect(await openEscrowRelease(released.sealed, client.privateKey)).toEqual({
            ...plaintext,
            version: 1,
            holdId: hold.hold.holdId,
        });
        await expect(
            enclave.verifyEscrowBlob({
                envelope: { ...envelope, keyId: 'unknown' },
                expectedDid: plaintext.did,
                expectedShareVersion: 1,
            })
        ).rejects.toBeInstanceOf(EscrowBlobError);
    });

    it.each([
        { policy: 'pin' as const, verifier: true, proof: 'ab'.repeat(32), error: undefined },
        {
            policy: 'pin' as const,
            verifier: true,
            proof: 'cd'.repeat(32),
            error: EscrowPinMismatchError,
        },
        { policy: 'pin' as const, verifier: true, proof: 'ab', error: EscrowPinMismatchError },
        { policy: 'pin' as const, verifier: true, proof: undefined, error: EscrowPolicyError },
        {
            policy: 'pin' as const,
            verifier: false,
            proof: 'ab'.repeat(32),
            error: EscrowPolicyError,
        },
        { policy: 'hold' as const, verifier: true, proof: 'cd'.repeat(32), error: undefined },
    ])(
        'checks policy/proof case %# without exposing the verifier',
        async ({ policy, verifier, proof, error }) => {
            const keys = await generateEscrowKeyPair();
            const client = await generateEscrowKeyPair();
            const enclave = new SoftwareEnclave({
                privateKeys: { test: keys.privateKey },
                activeKeyId: 'test',
            });
            const plaintext = {
                recoveryShare: 'ab'.repeat(33),
                did: 'did:key:test',
                shareVersion: 1,
            };
            const envelope = await encryptEscrowBlob(
                { ...plaintext, ...(verifier ? { pinVerifier: 'ab'.repeat(32) } : {}) },
                keys.publicKey,
                'test'
            );
            expect(
                await enclave.verifyEscrowBlob({
                    envelope,
                    expectedDid: plaintext.did,
                    expectedShareVersion: 1,
                })
            ).toEqual({ ok: true, hasPin: verifier });
            const createInput = {
                envelope,
                holdId: 'pin-hold',
                expectedDid: plaintext.did,
                expectedShareVersion: 1,
                enrollmentEpoch: 1,
                releasePolicy: policy,
                clientEphemeralPublicKey: client.publicKey,
            };
            if (policy === 'pin' && !verifier) {
                await expect(enclave.createHold(createInput)).rejects.toBeInstanceOf(
                    EscrowPolicyError
                );
                return;
            }
            const { holdRecord } = await enclave.createHold(createInput);
            const request = {
                envelope,
                expectedDid: plaintext.did,
                clientEphemeralPublicKey: client.publicKey,
                pinProof: proof,
                hold: holdRecord,
                now: new Date(holdRecord.hold.createdHi + holdRecord.holdDurationMs),
            };
            if (error) await expect(enclave.releaseEscrow(request)).rejects.toBeInstanceOf(error);
            else {
                const result = await enclave.releaseEscrow(request);
                expect(await openEscrowRelease(result.sealed, client.privateKey)).toEqual({
                    ...plaintext,
                    version: 1,
                    holdId: 'pin-hold',
                });
            }
        }
    );
});
