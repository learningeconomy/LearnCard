import type { EscrowEnvelope } from '@learncard/sss-key-manager';
import type { EscrowHold } from '../../models/EscrowHold';

export interface EnclaveAttestation {
    mode: 'software' | 'nitro';
    keyId: string;
    publicKey: string;
    measurements: { imageSha384?: string; pcr0?: string; pcr1?: string; pcr2?: string };
    document: string;
    issuedAt: string;
}
export type EscrowHoldForEnclave = Pick<
    EscrowHold,
    | '_id'
    | 'status'
    | 'releaseAfter'
    | 'releasePolicy'
    | 'primaryDid'
    | 'shareVersion'
    | 'clientEphemeralPublicKey'
>;
export interface VerifyEscrowBlobInput {
    envelope: EscrowEnvelope;
    expectedDid: string;
    expectedShareVersion: number;
}
export type VerifyEscrowBlobResult =
    { ok: true; hasPin: boolean } | { ok: false; hasPin: boolean; reason: string };
export interface ReleaseRequest {
    envelope: EscrowEnvelope;
    // P4.2: replace this unsigned passthrough with the enclave-signed HoldRecord
    // (services/escrow-enclave-app/src/wire.rs `HoldRecord`) once lca-api creates
    // one at hold-creation time.
    hold: EscrowHoldForEnclave;
    clientEphemeralPublicKey: string;
    expectedDid: string;
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
