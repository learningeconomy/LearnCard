/** Aggregate-only diagnostics. Never store owner/source identifiers or exception text. */
export const SKIP_REASON_LABELS = {
    missing_owner: 'Missing or invalid owner',
    missing_source: 'Source no longer present',
    missing_verification: 'Missing verification metadata',
    missing_consent_revision: 'Missing stored consent revision',
    consent_revision_changed: 'Consent revision changed',
    outside_consent_scope: 'Outside current consent scope',
    already_complete: 'Current Nova copies already complete',
    consent_missing: 'No current consent grant',
    consent_revoked: 'Consent revoked',
    consent_expired: 'Consent expired',
    guardian_required: 'Current guardian authorization required',
    consent_unavailable: 'Current consent unavailable',
    owner_erased: 'Owner erasure confirmed',
    empty_message: 'Empty message',
    representation_input_too_large: 'Safe credential projection exceeds 16 KiB',
} as const;
export type SkipReason = keyof typeof SKIP_REASON_LABELS;
export type SkipCounters = {
    skipped: number;
    skipReasons?: Partial<Record<SkipReason, number>>;
    dryRunObserved?: number;
};
export function recordSkip(job: SkipCounters, reason: SkipReason) {
    job.skipped += 1;
    job.skipReasons ??= {};
    job.skipReasons[reason] = (job.skipReasons[reason] ?? 0) + 1;
}
export function skipSummary(job: SkipCounters & { dryRun: boolean }) {
    const reasons = Object.entries(SKIP_REASON_LABELS).flatMap(([code, label]) => {
        const count = job.skipReasons?.[code as SkipReason];
        return Number.isSafeInteger(count) && count! > 0 ? [{ code, label, count: count! }] : [];
    });
    return {
        reasons: job.dryRun ? [] : reasons,
        // Legacy dry runs incremented skipped for every observation, without eligibility checks.
        observed: job.dryRun ? (job.dryRunObserved ?? 0) + job.skipped : 0,
        unknownHistorical: job.dryRun
            ? 0
            : Math.max(0, job.skipped - reasons.reduce((sum, reason) => sum + reason.count, 0)),
    };
}
