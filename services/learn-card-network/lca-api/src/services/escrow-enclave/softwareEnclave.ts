import { timingSafeEqual } from 'crypto';
import { escrowBlobIdentity } from './blobIdentity';
import type { EnclaveCreateHoldInput, EscrowHoldRecord, CancelHoldRequest } from './types';
import {
    decryptEscrowBlob,
    encryptEscrowBlob,
    sealEscrowRelease,
    parseEscrowEnvelope,
    type EscrowBlobPlaintext,
} from '@learncard/sss-key-manager';
import {
    EscrowBlobError,
    EscrowPolicyError,
    EscrowPinMismatchError,
    EscrowUnavailableError,
    type EscrowEnclave,
    type EnclaveAttestation,
    type VerifyEscrowBlobInput,
    type VerifyEscrowBlobResult,
    type ReleaseRequest,
    type ReleaseResult,
    type CarryPinVerifierInput,
    type RewrapEscrowBlobInput,
} from './types';

export interface SoftwareEnclaveConfig {
    privateKeys: Record<string, string>;
    activeKeyId: string;
    /** Supplied by the factory to match its configured host-trusted waiting period. */
    holdDurationMs?: number;
}

/** In-process backend for development; host time is not an attested clock. */
export class SoftwareEnclave implements EscrowEnclave {
    private readonly privateKeys: ReadonlyMap<string, string>;
    private readonly activeKeyId: string;
    private readonly holdDurationMs: number;
    constructor(config: SoftwareEnclaveConfig) {
        this.privateKeys = new Map(Object.entries(config.privateKeys));
        this.activeKeyId = config.activeKeyId;
        if (!this.privateKeys.has(this.activeKeyId)) throw new EscrowUnavailableError();
        // Match the factory configuration without a circular import; default is seven days.
        this.holdDurationMs = config.holdDurationMs ?? 7 * 24 * 60 * 60 * 1000;
    }
    async createHold(input: EnclaveCreateHoldInput): Promise<{ holdRecord: EscrowHoldRecord }> {
        const blob = await this.decrypt(input.envelope);
        if (
            blob.did !== input.expectedDid ||
            blob.shareVersion !== input.expectedShareVersion ||
            !Number.isInteger(input.enrollmentEpoch) ||
            input.enrollmentEpoch <= 0 ||
            (input.releasePolicy === 'pin' && !blob.pinVerifier)
        )
            throw new EscrowPolicyError();
        const blobHash = escrowBlobIdentity(input.envelope);
        const now = Date.now();
        return {
            holdRecord: {
                hold: {
                    holdId: input.holdId,
                    did: blob.did,
                    shareVersion: input.expectedShareVersion,
                    blobHash,
                    enrollmentEpoch: input.enrollmentEpoch,
                    releasePolicy: input.releasePolicy,
                    clientEphemeralPublicKey: input.clientEphemeralPublicKey,
                    createdLo: now,
                    createdHi: now,
                    policyVersion: 1,
                    // Non-cryptographic placeholder: software mode trusts the host entirely.
                    signature: 'software-mode-unsigned',
                },
                holdDurationMs: input.releasePolicy === 'pin' ? 0 : this.holdDurationMs,
                ledgerSeq: 0,
            },
        };
    }
    async cancelHold(input: CancelHoldRequest): Promise<void> {
        const blob = await this.decrypt(input.envelope);
        if (
            blob.did !== input.expectedDid ||
            blob.did !== input.hold.hold.did ||
            input.clientEphemeralPublicKey !== input.hold.hold.clientEphemeralPublicKey
        )
            throw new EscrowPolicyError();
        // Development only: Mongo owns cancellation; there is no software enclave ledger.
    }
    async getAttestation(_nonce?: Uint8Array): Promise<EnclaveAttestation> {
        try {
            const subtle = globalThis.crypto.subtle;
            const key = await subtle.importKey(
                'pkcs8',
                new Uint8Array(Buffer.from(this.privateKeys.get(this.activeKeyId)!, 'base64')),
                { name: 'ECDH', namedCurve: 'P-256' },
                true,
                ['deriveBits']
            );
            // WebCrypto cannot export a private CryptoKey as SPKI. Export its public
            // coordinates as JWK, import a public-only key, then export that as SPKI.
            const jwk = await subtle.exportKey('jwk', key);
            const publicKeyObject = await subtle.importKey(
                'jwk',
                { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
                { name: 'ECDH', namedCurve: 'P-256' },
                true,
                []
            );
            const publicKey = Buffer.from(await subtle.exportKey('spki', publicKeyObject)).toString(
                'base64'
            );
            const description = {
                mode: 'software' as const,
                keyId: this.activeKeyId,
                // P9.1 software-enclave equivalent: every OTHER configured key is
                // already decrypt-eligible in `decrypt()` below (keyed lookup by
                // envelope keyId, not restricted to `activeKeyId`) — this just
                // advertises that existing behaviour the same way the Nitro
                // backend advertises its `ESCROW_PREVIOUS_KEY_IDS`.
                previousKeyIds: [...this.privateKeys.keys()].filter(id => id !== this.activeKeyId),
                publicKey,
                issuedAt: new Date().toISOString(),
            };
            return {
                ...description,
                measurements: {},
                document: Buffer.from(JSON.stringify(description)).toString('base64'),
            };
        } catch {
            throw new EscrowUnavailableError();
        }
    }

    private async decrypt(envelope: unknown): Promise<EscrowBlobPlaintext> {
        try {
            const parsed = parseEscrowEnvelope(envelope);
            const key = this.privateKeys.get(parsed.keyId);
            if (!key) throw new EscrowBlobError();
            return await decryptEscrowBlob(parsed, key);
        } catch {
            throw new EscrowBlobError();
        }
    }

    async verifyEscrowBlob(input: VerifyEscrowBlobInput): Promise<VerifyEscrowBlobResult> {
        const blob = await this.decrypt(input.envelope);
        if (blob.did !== input.expectedDid || blob.shareVersion !== input.expectedShareVersion) {
            return {
                ok: false,
                hasPin: !!blob.pinVerifier,
                reason: 'Escrow recovery is not permitted.',
            };
        }
        return { ok: true, hasPin: !!blob.pinVerifier };
    }

    /**
     * Transfer only the verifier; recovery material remains sealed within the enclave.
     *
     * `input.sourceEnrollmentEpoch` is intentionally unused: software mode has no
     * enclave ledger to reset in the first place, so there is no epoch-scoped PIN
     * attempt budget to carry. The PIN attempt budget here is `escrowPin.failedAttempts`
     * / `verifiedFailedAttempts` in MongoDB (see routes/escrow.ts), which the enroll
     * route already copies forward unchanged on every carry, independent of
     * `enrollmentEpoch` — so software mode never had the epoch-reset bug this field
     * exists to fix in remote/nitro mode.
     */
    async carryPinVerifier(input: CarryPinVerifierInput) {
        const source = await this.decrypt(input.sourceEnvelope);
        const target = await this.decrypt(input.targetEnvelope);
        if (
            source.did !== input.expectedDid ||
            target.did !== input.expectedDid ||
            source.shareVersion !== input.sourceShareVersion ||
            target.shareVersion !== input.targetShareVersion ||
            target.shareVersion <= source.shareVersion ||
            !source.pinVerifier ||
            target.pinVerifier
        )
            throw new EscrowBlobError();
        const attestation = await this.getAttestation();
        return {
            envelope: await encryptEscrowBlob(
                { ...target, pinVerifier: source.pinVerifier },
                attestation.publicKey,
                attestation.keyId
            ),
        };
    }

    /**
     * Software-mode equivalent of the Nitro enclave's `rewrap_escrow_blob`
     * (P9.3): moves a blob sealed under any OTHER configured key onto the
     * active key, unchanged otherwise. Mirrors its refusal shape — an
     * envelope already under `activeKeyId` has nothing to migrate, and
     * `decrypt()` already throws `EscrowBlobError` for a keyId this backend
     * was never configured with, so both collapse into the same generic
     * error. `sourceEnrollmentEpoch` is unused for the same reason
     * `carryPinVerifier` ignores it above: no enclave ledger here, so no
     * epoch-scoped PIN attempt budget to carry.
     */
    async rewrapEscrowBlob(input: RewrapEscrowBlobInput) {
        const parsed = parseEscrowEnvelope(input.envelope);
        if (parsed.keyId === this.activeKeyId) throw new EscrowBlobError();
        const blob = await this.decrypt(input.envelope);
        if (blob.did !== input.expectedDid || blob.shareVersion !== input.expectedShareVersion)
            throw new EscrowBlobError();
        const attestation = await this.getAttestation();
        return {
            envelope: await encryptEscrowBlob(blob, attestation.publicKey, attestation.keyId),
        };
    }

    async releaseEscrow(input: ReleaseRequest): Promise<ReleaseResult> {
        const { hold } = input.hold;
        if (
            input.clientEphemeralPublicKey !== hold.clientEphemeralPublicKey ||
            !((input.now ?? new Date()).getTime() >= hold.createdHi + input.hold.holdDurationMs)
        )
            throw new EscrowPolicyError();
        const blob = await this.decrypt(input.envelope);
        if (
            blob.did !== input.expectedDid ||
            blob.did !== hold.did ||
            blob.shareVersion !== hold.shareVersion
        )
            throw new EscrowPolicyError();
        if (hold.releasePolicy === 'pin') {
            if (!blob.pinVerifier || !input.pinProof) throw new EscrowPolicyError();
            const expected = Buffer.from(blob.pinVerifier, 'hex');
            const actual = Buffer.from(input.pinProof, 'hex');
            if (
                !/^[0-9a-f]{64}$/i.test(input.pinProof) ||
                actual.length !== expected.length ||
                !timingSafeEqual(actual, expected)
            )
                throw new EscrowPinMismatchError();
        }
        try {
            return {
                sealed: await sealEscrowRelease(
                    {
                        recoveryShare: blob.recoveryShare,
                        did: blob.did,
                        shareVersion: blob.shareVersion,
                        holdId: hold.holdId,
                    },
                    input.clientEphemeralPublicKey
                ),
            };
        } catch {
            throw new EscrowBlobError();
        }
    }
}
