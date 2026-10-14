import type { EscrowEnvelope } from './escrow-crypto';

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
