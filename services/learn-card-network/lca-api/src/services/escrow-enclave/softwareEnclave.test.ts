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
    type EscrowHoldForEnclave,
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
        const hold: EscrowHoldForEnclave = {
            _id: 'test-hold',
            primaryDid: plaintext.did,
            shareVersion: 1,
            status: 'pending',
            releaseAfter: new Date(1000),
            releasePolicy: 'hold',
            clientEphemeralPublicKey: client.publicKey,
        };
        const request = {
            envelope,
            hold,
            clientEphemeralPublicKey: client.publicKey,
            expectedDid: plaintext.did,
        };
        await expect(
            enclave.releaseEscrow({ ...request, now: new Date(999) })
        ).rejects.toBeInstanceOf(EscrowPolicyError);
        for (const changed of [
            { status: 'cancelled' as const },
            { shareVersion: 2 },
            { primaryDid: 'did:key:wrong' },
        ]) {
            await expect(
                enclave.releaseEscrow({
                    ...request,
                    hold: { ...hold, ...changed },
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
            holdId: hold._id,
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
            const request = {
                envelope,
                expectedDid: plaintext.did,
                clientEphemeralPublicKey: client.publicKey,
                pinProof: proof,
                hold: {
                    _id: 'pin-hold',
                    status: 'pending' as const,
                    primaryDid: plaintext.did,
                    shareVersion: 1,
                    releasePolicy: policy,
                    releaseAfter: new Date(0),
                    clientEphemeralPublicKey: client.publicKey,
                },
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
