import type { RecordClass, RecordProvisioningBindingMetadata } from '@learncard/types';
import type { BindingRecordType } from 'types/binding';

/** A committed record ready for issuance. Fields are already restricted to the declaration. */
export type IssuableRecord = {
    recordId: string;
    bindingId: string;
    ecosystemId: string;
    subjectProfileId: string;
    fields: Record<string, string>;
    domain: string;
};

/**
 * What issuance produced; the record is kept either way. ISSUED: a credential was delivered.
 * OFFERED: a claim offer any sanctioned wallet can redeem (neutrality N3). ISSUE_FAILED: why not.
 */
export type IssuanceOutcome =
    | { status: 'ISSUED'; credentialUri: string }
    | { status: 'OFFERED'; offer: { protocol: 'vc-api' | 'oid4vci' | 'claim-link'; uri: string } }
    | { status: 'ISSUE_FAILED'; reason: string };

export type CredentialIssuerKind = 'platform' | 'dcc-workload' | 'external';

/**
 * Issuer and wallet neutrality N2 (RFC 2026-10): one interface per credential issuer that can
 * consume a record-provisioning lane. Platform Issuance is the first implementation; a DCC
 * issuer Workload or a bring-your-own issuer service plug in here without changing the lane.
 */
export interface CredentialIssuerAdapter {
    /** Stable identifier for audit and diagnostics. */
    readonly kind: CredentialIssuerKind;
    /**
     * Record classes this issuer can turn into credentials (ADR-013 §3.1 consumer declaration).
     * Platform Issuance has no manifest, so its classes are server-owned; Workload and
     * Integration issuers must take them from the consumer's signed declaration.
     */
    readonly supportedRecordClasses: readonly RecordClass[];
    /** Approval-time reasons the Binding cannot issue; empty when ready. */
    readinessGaps(binding: BindingRecordType): Promise<string[]>;
    /** Release-time check that the Binding declares everything issuance needs. */
    canIssue(metadata: RecordProvisioningBindingMetadata): boolean;
    /**
     * Issues a committed record. Must be idempotent per recordId, never throw for denial, and
     * re-check its own readiness: release trusts approval, but readiness can change after it.
     */
    issue(
        record: IssuableRecord,
        metadata: RecordProvisioningBindingMetadata
    ): Promise<IssuanceOutcome>;
}
