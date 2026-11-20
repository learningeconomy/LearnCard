import type { VerificationCheck } from '@learncard/types';
import type { ClrJsonObject } from './types';

export type ClrProofState = 'checking' | 'verified' | 'invalid' | 'unavailable' | 'unsigned';
export type ClrLifecycleState = 'unchecked' | 'active' | 'revoked' | 'suspended' | 'unavailable';
export type ClrSubjectBinding = 'matched' | 'mismatch' | 'unknown' | 'not-applicable';

export interface VerificationBudget {
    remaining(): number;
    expired(): boolean;
    cancelled(): boolean;
    cancel(): void;
    whenCancelled(): Promise<never>;
}

/** Async display evidence only: the canonical credential and its claims remain untouched. */
export interface ClrCredentialVerification {
    occurrencePath: string;
    issuerDid?: string;
    issuerName?: string;
    issuerImage?: string;
    verificationMethods: string[];
    proof: ClrProofState;
    lifecycle: ClrLifecycleState;
    validity?: 'expired' | 'not-yet-valid';
    binding: ClrSubjectBinding;
    checks: string[];
    warnings: string[];
    errors: string[];
    status: NonNullable<VerificationCheck['status']>;
    /** Descendant evidence never substitutes for this credential's own signature. */
    descendants: ClrCredentialVerification[];
}

export interface ClrVerificationSnapshot {
    outer: ClrCredentialVerification;
    /** Keys are the normalizer's unique canonical IDs, never raw credential IDs/aliases. */
    records: Readonly<Record<string, ClrCredentialVerification>>;
    complete: boolean;
}

export type ClrCredentialVerifier = (credential: ClrJsonObject) => Promise<VerificationCheck>;
