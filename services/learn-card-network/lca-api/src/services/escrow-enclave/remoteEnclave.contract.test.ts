import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
} from '@learncard/sss-key-manager';
import { createRemoteEnclave } from './remoteEnclave';
import { escrowBlobIdentity } from './blobIdentity';
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
        const blobHash = escrowBlobIdentity(envelope);
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

    it('carries a PIN verifier into a newer blob and releases it with the original PIN', async () => {
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
        const client = await generateEscrowKeyPair();
        const did = `did:key:contract-carry-${randomUUID()}`;
        const pinProof = 'ab'.repeat(32);
        const sourceEnvelope = await encryptEscrowBlob(
            { recoveryShare: 'ab'.repeat(33), did, shareVersion: 1, pinVerifier: pinProof },
            attestation.publicKey,
            attestation.keyId
        );
        const targetPlaintext = { recoveryShare: 'cd'.repeat(33), did, shareVersion: 2 };
        const targetEnvelope = await encryptEscrowBlob(
            targetPlaintext,
            attestation.publicKey,
            attestation.keyId
        );
        try {
            // Carry now signs a ledger genesis using trusted time; hold time must
            // not move backwards relative to that record.
            await replace(JSON.stringify({ nowMs: 1_700_000_000_000 }));
            const { envelope: carried } = await enclave.carryPinVerifier({
                sourceEnvelope,
                targetEnvelope,
                expectedDid: did,
                sourceShareVersion: 1,
                targetShareVersion: 2,
                targetEnrollmentEpoch: 2,
                sourceEnrollmentEpoch: 1,
            });
            await expect(
                enclave.verifyEscrowBlob({
                    envelope: carried,
                    expectedDid: did,
                    expectedShareVersion: 2,
                })
            ).resolves.toEqual({ ok: true, hasPin: true });

            await replace(
                JSON.stringify({
                    nowMs: 1_700_000_000_000,
                    enrollments: {
                        [did]: { epoch: 2, shareVersion: 2, blobHash: escrowBlobIdentity(carried) },
                    },
                })
            );
            const holdId = randomUUID();
            const { holdRecord } = await enclave.createHold({
                envelope: carried,
                holdId,
                expectedDid: did,
                expectedShareVersion: 2,
                enrollmentEpoch: 2,
                releasePolicy: 'pin',
                clientEphemeralPublicKey: client.publicKey,
            });
            const released = await enclave.releaseEscrow({
                envelope: carried,
                hold: holdRecord,
                expectedDid: did,
                clientEphemeralPublicKey: client.publicKey,
                pinProof,
            });
            expect(await openEscrowRelease(released.sealed, client.privateKey)).toEqual({
                ...targetPlaintext,
                version: 1,
                holdId,
            });
        } finally {
            await replace(original);
        }
    });

    // Carry changes the blob and therefore the chain. Its signed genesis must
    // preserve the spent budget regardless of the destination epoch.
    it('carries the PIN attempt budget across a rotation: N failures then only 10-N remain', async () => {
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
        const client = await generateEscrowKeyPair();
        const did = `did:key:contract-budget-${randomUUID()}`;
        const pinProof = 'ab'.repeat(32);
        const wrongProof = 'cd'.repeat(32);
        const sourceEnvelope = await encryptEscrowBlob(
            { recoveryShare: 'ab'.repeat(33), did, shareVersion: 1, pinVerifier: pinProof },
            attestation.publicKey,
            attestation.keyId
        );
        const attempt = async (
            envelope: typeof sourceEnvelope,
            shareVersion: number,
            epoch: number
        ) => {
            const holdId = randomUUID();
            const { holdRecord } = await enclave.createHold({
                envelope,
                holdId,
                expectedDid: did,
                expectedShareVersion: shareVersion,
                enrollmentEpoch: epoch,
                releasePolicy: 'pin',
                clientEphemeralPublicKey: client.publicKey,
            });
            return enclave.releaseEscrow({
                envelope,
                hold: holdRecord,
                expectedDid: did,
                clientEphemeralPublicKey: client.publicKey,
                pinProof: wrongProof,
            });
        };
        try {
            await replace(
                JSON.stringify({
                    nowMs: 1_700_000_000_000,
                    enrollments: {
                        [did]: {
                            epoch: 1,
                            shareVersion: 1,
                            blobHash: escrowBlobIdentity(sourceEnvelope),
                        },
                    },
                })
            );
            const failedAttempts = 3;
            for (let i = 0; i < failedAttempts; i += 1) {
                await expect(attempt(sourceEnvelope, 1, 1)).rejects.toBeInstanceOf(
                    EscrowPinMismatchError
                );
            }
            const targetEnvelope = await encryptEscrowBlob(
                { recoveryShare: 'ef'.repeat(33), did, shareVersion: 2 },
                attestation.publicKey,
                attestation.keyId
            );
            const { envelope: carried } = await enclave.carryPinVerifier({
                sourceEnvelope,
                targetEnvelope,
                expectedDid: did,
                sourceShareVersion: 1,
                targetShareVersion: 2,
                targetEnrollmentEpoch: 2,
                sourceEnrollmentEpoch: 1,
            });
            // Every real blob write bumps enrollmentEpoch; simulate that here.
            await replace(
                JSON.stringify({
                    nowMs: 1_700_000_000_000,
                    enrollments: {
                        [did]: { epoch: 2, shareVersion: 2, blobHash: escrowBlobIdentity(carried) },
                    },
                })
            );
            const remaining = 10 - failedAttempts;
            for (let i = 0; i < remaining; i += 1) {
                await expect(attempt(carried, 2, 2)).rejects.toBeInstanceOf(EscrowPinMismatchError);
            }
            // One more than the remaining budget: refused before comparing the
            // PIN at all (even the CORRECT PIN fails), because 3 (carried) + 7
            // (this epoch) already equals the ten-attempt lifetime maximum.
            const holdId = randomUUID();
            const { holdRecord } = await enclave.createHold({
                envelope: carried,
                holdId,
                expectedDid: did,
                expectedShareVersion: 2,
                enrollmentEpoch: 2,
                releasePolicy: 'pin',
                clientEphemeralPublicKey: client.publicKey,
            });
            await expect(
                enclave.releaseEscrow({
                    envelope: carried,
                    hold: holdRecord,
                    expectedDid: did,
                    clientEphemeralPublicKey: client.publicKey,
                    pinProof,
                })
            ).rejects.toBeInstanceOf(EscrowPolicyError);
        } finally {
            await replace(original);
        }
    }, 20_000);
});
