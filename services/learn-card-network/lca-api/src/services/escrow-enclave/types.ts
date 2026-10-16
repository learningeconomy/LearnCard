import type { EscrowEnvelope, SignedEscrowEnrollmentIntent } from '@learncard/sss-key-manager';
import type {
    AuthorityRecord,
    AuthorityHoldReceipt,
    AuthorityMutationResult,
    AuthorityStateResponse,
} from './authorityContract';
export interface ApplyEnrollmentInput {
    signedIntent: SignedEscrowEnrollmentIntent;
    sourceEnvelope: EscrowEnvelope | null;
    targetEnvelope: EscrowEnvelope | null;
}
// Hold records are independent of host Mongo status and deadlines.

export interface EnclaveAttestation {
    mode: 'software' | 'nitro';
    keyId: string;
    /** P9.1: retired keyIds the enclave still accepts for decrypt only (never
     * for sealing output). Empty/absent means no previous key is configured. */
    previousKeyIds?: string[];
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
    requestId?: string;
    envelope: EscrowEnvelope;
    hold: EscrowHoldRecord;
    clientEphemeralPublicKey: string;
    expectedDid: string;
}
/** P9.1 (attack C): `code` is the one-time code itself (compared against a
 * stored hash enclave-side), never a proof — unlike `ReleaseRequest.pinProof`. */
export interface ConfirmHoldRequest extends CancelHoldRequest {
    code: string;
}
export type ResendCodeRequest = CancelHoldRequest;
/** P9.1 (attack C): system-initiated (lca-api's hourly job) — no envelope or
 * signed hold, since there is no user action to authenticate. */
export interface SendReleaseWarningRequest {
    requestId?: string;
    holdId: string;
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
    receipt?: AuthorityRecord;
}
export interface CarryPinVerifierInput {
    sourceEnvelope: EscrowEnvelope;
    targetEnvelope: EscrowEnvelope;
    expectedDid: string;
    sourceShareVersion: number;
    targetShareVersion: number;
    /** Signed source-record binding; blob hash, not epoch, selects the chain. */
    sourceEnrollmentEpoch: number;
    /** Signed binding for the output blob's first Carried record. */
    targetEnrollmentEpoch: number;
}
export interface RewrapEscrowBlobInput {
    envelope: EscrowEnvelope;
    expectedDid: string;
    expectedShareVersion: number;
    /** Source and destination record binding. Rewrap preserves this epoch. */
    sourceEnrollmentEpoch: number;
}
export interface EscrowEnclave {
    /** Remote authority only; software mode must not impersonate signed authority. */
    getEnrollmentState?(input: {
        expectedDid: string;
        nonce: string;
    }): Promise<AuthorityStateResponse>;
    applyEnrollmentIntent?(input: ApplyEnrollmentInput): Promise<AuthorityMutationResult>;
    /** `nonce` binds a nitro attestation to one client-generated challenge (64 hex chars,
     * decoded to bytes); the software backend has no freshness story and ignores it. */
    getAttestation(nonce?: Uint8Array): Promise<EnclaveAttestation>;
    verifyEscrowBlob(input: VerifyEscrowBlobInput): Promise<VerifyEscrowBlobResult>;
    carryPinVerifier(input: CarryPinVerifierInput): Promise<{ envelope: EscrowEnvelope }>;
    /** P9.3: migrates a copy sealed under a recognised PREVIOUS key onto the
     * CURRENT key (same did/shareVersion/recoveryShare/pinVerifier), so a
     * previous key can eventually be retired. Refuses (generic
     * `EscrowBlobError`) unless the envelope's own keyId is a recognised
     * previous key — never the current key (nothing to migrate) or an
     * unknown one. */
    rewrapEscrowBlob(
        input: RewrapEscrowBlobInput
    ): Promise<{ envelope: EscrowEnvelope; authority?: AuthorityMutationResult }>;
    releaseEscrow(input: ReleaseRequest): Promise<ReleaseResult>;
    createHold(input: EnclaveCreateHoldInput): Promise<{ holdRecord: EscrowHoldRecord }>;
    cancelHold(input: CancelHoldRequest): Promise<void | { receipt: AuthorityRecord }>;
    /** P9.1 (attack C): authority (nitro) mode only — software mode never
     * produces an awaiting-confirmation hold, so it has nothing to confirm.
     * `confirmedAtMs` is the enclave's authoritative confirmation time
     * (present on both a fresh confirm and an idempotent retry); callers
     * must use it instead of a locally-observed clock to compute deadlines. */
    confirmHold?(
        input: ConfirmHoldRequest
    ): Promise<{ receipt: AuthorityHoldReceipt; confirmedAtMs: number }>;
    resendCode?(input: ResendCodeRequest): Promise<{ receipt: AuthorityRecord }>;
    /** `releaseWarningSentAtMs` is the enclave's authoritative warning-sent
     * time, present on both a fresh send and an idempotent retry. */
    sendReleaseWarning?(
        input: SendReleaseWarningRequest
    ): Promise<{ receipt: AuthorityHoldReceipt; releaseWarningSentAtMs: number }>;
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
