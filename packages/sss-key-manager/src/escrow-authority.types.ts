import type { EscrowEnvelope } from './escrow-crypto';

/** Unverifiable or substituted recovery evidence; callers must not continue recovery. */
export class EscrowEvidenceError extends Error {
    constructor() {
        super('Automatic recovery evidence could not be verified.');
        this.name = 'EscrowEvidenceError';
    }
}

/** Opt-in for previously issued hold evidence only. Measurements are SHA-256
 * hashes of complete configured PCR0/1/2 tuples, never server-supplied values.
 * The original authority generation and current attested ledger key remain pinned.
 * Fresh receipts must omit this option and match the current measurement exactly. */
export interface HistoricalEscrowEvidence {
    historical: true;
    allowedMeasurements: readonly string[];
    authorityGeneration: string;
}

/** Only construct from verified, nonce-bound NSM evidence (never wrapper JSON). */
export interface VerifiedEnclaveIdentity {
    publicKey: string;
    keyId: string;
    previousKeyIds: string[];
    mode: 'software' | 'nitro';
    authority?: { ledgerPublicKey: string; measurement: string };
}

export interface EscrowAuthorityRecord {
    version: 1;
    kind: 'proposal' | 'commit' | 'snapshot';
    keyId: string;
    measurement: number[];
    payload: string;
    signature: string;
}

export interface EscrowAuthorityState {
    tenant: string;
    authorityGeneration: string;
    did: string;
    enrollmentVersion: number;
    enrollmentEpoch: number;
    status: 'empty' | 'active' | 'disabled';
    envelope: EscrowEnvelope | null;
    shareVersion: number | null;
    hasPin: boolean;
    pinGeneration: number;
    attemptsUsed: number;
}

export interface VerifiedEscrowMutation {
    envelope: EscrowEnvelope | null;
    receipt: EscrowAuthorityRecord;
}
