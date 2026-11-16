import type { EscrowEnvelope } from './escrow-crypto';

/** Unverifiable or substituted recovery evidence; callers must not continue recovery. */
export class EscrowEvidenceError extends Error {
    constructor() {
        super('Automatic recovery evidence could not be verified.');
        this.name = 'EscrowEvidenceError';
    }
}

/** Shape of an escrow authority tenant label (mirrors the enclave's measured label check). */
export const ESCROW_AUTHORITY_TENANT_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Validly signed evidence bound to a different authority tenant than this client expects.
 * The enclave is single-tenant (its measured `ESCROW_AUTHORITY_TENANT` label), so this is
 * a deployment misconfiguration, not a forgery: the app's `escrowAuthorityTenant` does not
 * match the enclave it talks to. Still an {@link EscrowEvidenceError}, so every existing
 * fail-closed path treats it the same way; only the message is specific. Labels are public
 * deployment identifiers, never user data.
 */
export class EscrowAuthorityTenantMismatchError extends EscrowEvidenceError {
    readonly expectedTenant: string;
    readonly signedTenant: string;

    constructor(expectedTenant: string, signedTenant: string) {
        super();
        this.name = 'EscrowAuthorityTenantMismatchError';
        this.expectedTenant = expectedTenant;
        this.signedTenant = signedTenant;
        this.message =
            `Escrow authority tenant mismatch: the enclave signed for "${signedTenant}" but this ` +
            `app expects "${expectedTenant}". Set auth.sss.escrowAuthorityTenant to the ` +
            `enclave's ESCROW_AUTHORITY_TENANT.`;
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
