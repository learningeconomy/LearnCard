import { describe, it, expect } from 'vitest';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
} from '@learncard/sss-key-manager';
import { createRemoteEnclave } from './remoteEnclave';
import { EscrowPinMismatchError, EscrowPolicyError } from './types';

// Runs the HTTP contract implemented in remoteEnclave.ts against a live
// `escrow-enclave --emulate` process (services/escrow-enclave-app, P1.8).
//
// Requires an explicitly configured live endpoint; skipped in normal CI.
// Start the enclave with all four fake features, --emulate 127.0.0.1:5000,
// --emulate-http 127.0.0.1:8443, and ESCROW_ENCLAVE_EMULATE_TOKEN.
// Set ESCROW_ENCLAVE_EMULATE_FIXTURE in BOTH processes to the same disposable
// JSON fixture (initial contents: {}). Enrollment is provisioned through this
// fake-only authority, never trusted from the HTTP create-hold request.
//
//   ESCROW_ENCLAVE_CONTRACT_URL=http://127.0.0.1:8443 \
//     bunx vitest run --config vitest.config.ts src/services/escrow-enclave/remoteEnclave.contract.test.ts
//
// Optionally set ESCROW_ENCLAVE_CONTRACT_TOKEN to match whatever bearer token
// the emulate server is configured to accept.
const contractUrl = process.env.ESCROW_ENCLAVE_CONTRACT_URL;

describe.skipIf(!contractUrl)('remote enclave contract (escrow-enclave --emulate)', () => {
    const enclave = createRemoteEnclave({
        baseUrl: contractUrl ?? '',
        token: process.env.ESCROW_ENCLAVE_CONTRACT_TOKEN ?? 'contract-test-token',
        timeoutMs: 10_000,
    });

    it('returns a well-formed attestation for a fresh nonce', async () => {
        const nonce = globalThis.crypto.getRandomValues(new Uint8Array(32));

        const attestation = await enclave.getAttestation(nonce);

        expect(['software', 'nitro']).toContain(attestation.mode);
        expect(attestation.keyId.length).toBeGreaterThan(0);
        expect(attestation.publicKey.length).toBeGreaterThan(0);
        expect(attestation.document.length).toBeGreaterThan(0);
        expect(() => new Date(attestation.issuedAt).toISOString()).not.toThrow();
    });

    it('verifies a blob encrypted to the attested public key', async () => {
        const attestation = await enclave.getAttestation();
        const did = 'did:key:contract-test';
        const envelope = await encryptEscrowBlob(
            { recoveryShare: 'ab'.repeat(33), did, shareVersion: 1 },
            attestation.publicKey,
            attestation.keyId
        );

        await expect(
            enclave.verifyEscrowBlob({ envelope, expectedDid: did, expectedShareVersion: 1 })
        ).resolves.toEqual({ ok: true, hasPin: false });
    });

    it('creates, releases, opens, refuses replay, rejects wrong PIN, and cancels real holds', async () => {
        const fixturePath = process.env.ESCROW_ENCLAVE_EMULATE_FIXTURE;
        if (!fixturePath)
            throw new Error(
                'Set ESCROW_ENCLAVE_EMULATE_FIXTURE for the emulator and contract test'
            );
        const original = await readFile(fixturePath, 'utf8');
        const replace = async (contents: string) => {
            const temporary = `${fixturePath}.${randomUUID()}.tmp`;
            await writeFile(temporary, contents, { mode: 0o600 });
            await rename(temporary, fixturePath);
        };
        const attestation = await enclave.getAttestation();
        expect(attestation.mode).toBe('software');
        const client = await generateEscrowKeyPair();
        const did = `did:key:contract-${randomUUID()}`;
        const plaintext = { recoveryShare: 'ab'.repeat(33), did, shareVersion: 1 };
        const pinProof = 'ab'.repeat(32);
        const envelope = await encryptEscrowBlob(
            { ...plaintext, pinVerifier: pinProof },
            attestation.publicKey,
            attestation.keyId
        );
        // Match the enclave's declared envelope field order, not arbitrary JS order.
        const { version, algorithm, keyId, ephemeralPublicKey, salt, iv, ciphertext } = envelope;
        const blobHash = createHash('sha256')
            .update(
                JSON.stringify({
                    version,
                    algorithm,
                    keyId,
                    ephemeralPublicKey,
                    salt,
                    iv,
                    ciphertext,
                })
            )
            .digest('hex');
        try {
            await replace(
                JSON.stringify({
                    nowMs: 1_700_000_000_000,
                    enrollments: { [did]: { epoch: 1, shareVersion: 1, blobHash } },
                })
            );
            const create = async () => {
                const holdId = randomUUID();
                const { holdRecord } = await enclave.createHold({
                    envelope,
                    holdId,
                    expectedDid: did,
                    expectedShareVersion: 1,
                    enrollmentEpoch: 1,
                    releasePolicy: 'pin',
                    clientEphemeralPublicKey: client.publicKey,
                });
                expect(holdRecord.hold.holdId).toBe(holdId);
                expect(holdRecord.holdDurationMs).toBe(604_800_000);
                return {
                    holdId,
                    request: {
                        envelope,
                        hold: holdRecord,
                        expectedDid: did,
                        clientEphemeralPublicKey: client.publicKey,
                    },
                };
            };
            const successful = await create();
            const request = { ...successful.request, pinProof };
            const released = await enclave.releaseEscrow(request);
            expect(await openEscrowRelease(released.sealed, client.privateKey)).toEqual({
                ...plaintext,
                version: 1,
                holdId: successful.holdId,
            });
            await expect(enclave.releaseEscrow(request)).rejects.toBeInstanceOf(EscrowPolicyError);

            const wrong = await create();
            await expect(
                enclave.releaseEscrow({ ...wrong.request, pinProof: 'cd'.repeat(32) })
            ).rejects.toBeInstanceOf(EscrowPinMismatchError);

            const cancelled = await create();
            await enclave.cancelHold(cancelled.request);
            await expect(
                enclave.releaseEscrow({ ...cancelled.request, pinProof })
            ).rejects.toBeInstanceOf(EscrowPolicyError);
        } finally {
            await replace(original);
        }
    });
});
