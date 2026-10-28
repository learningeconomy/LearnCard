import type { SupplementalRecovery } from './supplemental-recovery';
import type { GenerationRetryPolicy } from './generation-retry';
import { repairSourceFingerprint, REPAIR_SOURCE_PROJECTION } from './legacy-repair-source';
import { createHash } from 'node:crypto';
import type { ObjectId } from 'mongodb';
import type { CoverageSource } from './coverage-model';

export type RunSource = Omit<CoverageSource, '_id'> & {
    _id: ObjectId;
    source?: string;
    category?: string;
    rawContentHash?: string;
    projection?: { schemaVersion?: string };
    verification?: CoverageSource['verification'] & {
        status?: string;
        credentialUri?: string;
        checks?: string[];
        errors?: string[];
    };
};
export type SnapshotEntry = {
    id: string;
    fingerprint: string;
    originalHash?: string;
};
// Deliberately never select credential contents, raw originals or projection facts.
export const RUN_SOURCE_PROJECTION = {
    _id: 1,
    did: 1,
    uri: 1,
    source: 1,
    embeddingEpoch: 1,
    'projection.schemaVersion': 1,
    'verification.status': 1,
    'verification.credentialUri': 1,
    'verification.checks': 1,
    'verification.errors': 1,
    'verification.contentHash': 1,
    'verification.consent.revision': 1,
};
export const digest = (value: unknown) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const runSourceFingerprint = (source: Omit<RunSource, '_id'> & { _id: unknown }) =>
    digest([
        String(source._id),
        source.did,
        source.uri,
        source.source,
        source.embeddingEpoch,
        source.projection?.schemaVersion,
        source.verification?.status,
        source.verification?.credentialUri,
        source.verification?.checks,
        source.verification?.errors,
        source.verification?.contentHash,
        source.verification?.consent?.revision,
    ]);
export const EXCLUSION_LABELS = {
    missing_source_identity: 'Missing or invalid source ID, owner or URI',
    missing_verification: 'Missing verification metadata',
    invalid_verification: 'Invalid or incomplete proof verification',
    missing_projection: 'Missing or unsupported safe projection',
    missing_source_hash: 'Missing or invalid source content hash',
    missing_consent_revision: 'Missing consent revision',
    owner_erased: 'Owner erasure requested',
} as const;
export type ExclusionReason = keyof typeof EXCLUSION_LABELS;
export function metadataExclusionReason(source: RunSource): ExclusionReason | undefined {
    if (
        !/^[0-9a-f]{24}$/i.test(String(source._id)) ||
        typeof source.did !== 'string' ||
        !source.did.startsWith('did:') ||
        typeof source.uri !== 'string' ||
        !source.uri
    )
        return 'missing_source_identity';
    if (!source.verification) return 'missing_verification';
    if (
        source.verification.status !== 'valid' ||
        source.verification.credentialUri !== source.uri ||
        !Array.isArray(source.verification.checks) ||
        !source.verification.checks.includes('proof') ||
        !Array.isArray(source.verification.errors) ||
        source.verification.errors.length
    )
        return 'invalid_verification';
    if (source.projection?.schemaVersion !== '1') return 'missing_projection';
    if (!/^[0-9a-f]{64}$/.test(source.verification.contentHash ?? '')) return 'missing_source_hash';
    if (!source.verification.consent?.revision) return 'missing_consent_revision';
}
export const metadataEligible = (source: RunSource) =>
    metadataExclusionReason(source) === undefined;

// v2 preserves every selected row, including rows that cannot be repaired.
// The reviewed fingerprint never changes; only a fenced workflow transition
// may record the verified source version which is eligible for paid work.
export const WORKFLOW_SOURCE_PROJECTION = {
    ...REPAIR_SOURCE_PROJECTION,
    'projection.schemaVersion': 1,
} as const;
export const workflowSourceFingerprint = (source: unknown) =>
    digest([repairSourceFingerprint(source), (source as RunSource)?.projection?.schemaVersion]);
export type WorkflowOperation = {
    runId: string;
    lease: string;
    index: number;
    initialFingerprint: string;
    originalHash?: string;
};
export type WorkflowItem = {
    _id: string;
    runId: string;
    index: number;
    sourceId: string;
    initialFingerprint: string;
    originalHash?: string;
    state: 'pending' | 'embedding_ready' | 'written' | 'already_complete' | 'blocked';
    repairFingerprint?: string;
    revision?: string;
    resolvedFingerprint?: string;
    repaired?: boolean;
    reason?: string;
    reconciled?: boolean;
    autoRetries?: number;
    supplementalRecovery?: SupplementalRecovery;
    generationRetry?: {
        policy?: GenerationRetryPolicy;
        attempt: number;
        failureErrors: number;
        failureAt: string;
        nextAttemptAt: Date;
        phase: 'waiting' | 'claimed' | 'abandoned';
    };
    attemptBaseline?: {
        written: number;
        skipped: number;
        errors: number;
        skipReasons?: Partial<Record<string, number>>;
    };
};
