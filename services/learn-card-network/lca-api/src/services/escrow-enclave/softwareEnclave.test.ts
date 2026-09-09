import { describe, it, expect } from 'vitest';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
} from '@learncard/sss-key-manager';
import { SoftwareEnclave } from './softwareEnclave';
import { EscrowBlobError, EscrowPolicyError, type EscrowHoldForEnclave } from './types';

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
        ).toEqual({ ok: true });
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
});
