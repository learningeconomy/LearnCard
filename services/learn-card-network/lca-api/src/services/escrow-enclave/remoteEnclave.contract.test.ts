import { describe, it, expect } from 'vitest';
import { encryptEscrowBlob } from '@learncard/sss-key-manager';
import { createRemoteEnclave } from './remoteEnclave';

// Runs the HTTP contract implemented in remoteEnclave.ts against a live
// `escrow-enclave --emulate` process (services/escrow-enclave-app, P1.8).
//
// P1.8 (the HTTP server for the emulate binary) has not been built yet, so this
// suite is skipped by default. Once it exists, start it from
// services/escrow-enclave-app with:
//
//   cargo run --features fake-nsm -- --emulate 127.0.0.1:5000
//
// then run this file with:
//
//   ESCROW_ENCLAVE_CONTRACT_URL=http://127.0.0.1:5000 \
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
});
