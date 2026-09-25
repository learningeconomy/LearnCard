import { timingSafeEqual, createHash } from 'crypto';
import type { EnclaveCreateHoldInput, EscrowHoldRecord, CancelHoldRequest } from './types';
import {
    decryptEscrowBlob,
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
        const { version, algorithm, keyId, ephemeralPublicKey, salt, iv, ciphertext } =
            input.envelope;
        // Match policy.rs blob_hash's declared field order and compact JSON.
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
