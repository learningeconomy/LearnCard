import type { EscrowEnvelope } from '@learncard/sss-key-manager';
// Hold records are independent of host Mongo status and deadlines.

export interface EnclaveAttestation {
    mode: 'software' | 'nitro';
    keyId: string;
    publicKey: string;
    measurements: { imageSha384?: string; pcr0?: string; pcr1?: string; pcr2?: string };
    document: string;
    issuedAt: string;
}
export interface EscrowHoldRecord {
    [key: string]: unknown;
    hold: {
        [key: string]: unknown;
        holdId: string;
        did: string;
        shareVersion: number;
        blobHash: string;
        enrollmentEpoch: number;
        releasePolicy: 'hold' | 'pin';
        clientEphemeralPublicKey: string;
        createdLo: number;
        createdHi: number;
        policyVersion: number;
        signature: string;
    };
    holdDurationMs: number;
    ledgerSeq: number;
}
export interface EnclaveCreateHoldInput {
    envelope: EscrowEnvelope;
    holdId: string;
    expectedDid: string;
    expectedShareVersion: number;
    enrollmentEpoch: number;
    releasePolicy: 'hold' | 'pin';
    clientEphemeralPublicKey: string;
}
export interface CancelHoldRequest {
    envelope: EscrowEnvelope;
    hold: EscrowHoldRecord;
    clientEphemeralPublicKey: string;
    expectedDid: string;
}
export interface VerifyEscrowBlobInput {
    envelope: EscrowEnvelope;
    expectedDid: string;
    expectedShareVersion: number;
}
export type VerifyEscrowBlobResult =
    { ok: true; hasPin: boolean } | { ok: false; hasPin: boolean; reason: string };
export interface ReleaseRequest extends CancelHoldRequest {
    /** Development-only host clock; never forwarded by the remote backend. */
    now?: Date;
    pinProof?: string;
}
export interface ReleaseResult {
    sealed: EscrowEnvelope;
}
export interface EscrowEnclave {
    /** `nonce` binds a nitro attestation to one client-generated challenge (64 hex chars,
     * decoded to bytes); the software backend has no freshness story and ignores it. */
    getAttestation(nonce?: Uint8Array): Promise<EnclaveAttestation>;
    verifyEscrowBlob(input: VerifyEscrowBlobInput): Promise<VerifyEscrowBlobResult>;
    releaseEscrow(input: ReleaseRequest): Promise<ReleaseResult>;
    createHold(input: EnclaveCreateHoldInput): Promise<{ holdRecord: EscrowHoldRecord }>;
    cancelHold(input: CancelHoldRequest): Promise<void>;
}
export class EscrowPolicyError extends Error {
    constructor() {
        super('Escrow recovery is not permitted.');
        this.name = 'EscrowPolicyError';
    }
}
export class EscrowPinMismatchError extends Error {
    constructor() {
        super('Incorrect PIN.');
        this.name = 'EscrowPinMismatchError';
    }
}
export class EscrowBlobError extends Error {
    constructor() {
        super('Invalid escrow payload.');
        this.name = 'EscrowBlobError';
    }
}
export class EscrowUnavailableError extends Error {
    constructor() {
        super('Escrow recovery is not available.');
        this.name = 'EscrowUnavailableError';
    }
}
