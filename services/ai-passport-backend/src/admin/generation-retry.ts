import type { BackfillJob } from './backfill';
import { sanitizeBackfillFailure } from './backfill-diagnostics';

export const GENERATION_RETRY_POLICY = 'http5xx-v1' as const;
export const TRANSIENT_GENERATION_RETRY_POLICY = 'transient-v2' as const;
export type GenerationRetryPolicy =
    typeof GENERATION_RETRY_POLICY | typeof TRANSIENT_GENERATION_RETRY_POLICY;
export const isGenerationRetryPolicy = (value: unknown): value is GenerationRetryPolicy =>
    value === GENERATION_RETRY_POLICY || value === TRANSIENT_GENERATION_RETRY_POLICY;
export const GENERATION_RETRY_DELAYS_MS = [30_000, 120_000, 300_000] as const;
export const generationRetryNow = () => Date.now();
export const sleepForGenerationRetry = (milliseconds: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, milliseconds));

/** An explicit HTTP error is still potentially billable, never proof of no egress. */
export function isRetryableGenerationFailure(
    before: BackfillJob,
    result: BackfillJob | null | undefined,
    index: number,
    policy: GenerationRetryPolicy = GENERATION_RETRY_POLICY
): boolean {
    if (
        !result ||
        result.errors !== before.errors + 1 ||
        result.lastError !== 'record_failed_or_budget_exhausted_cursor_preserved' ||
        before.snapshotIndex !== index ||
        result.snapshotIndex !== index ||
        result.cursor !== before.cursor ||
        result.written !== before.written ||
        result.skipped !== before.skipped
    )
        return false;
    const failure = sanitizeBackfillFailure(result.lastFailure);
    if (
        !failure ||
        failure.record !== index + 1 ||
        failure.stage !== 'generation' ||
        failure.dispatchStatus !== 'possibly_dispatched' ||
        failure.providerOperation !== 'request' ||
        failure.providerFailureReason !== 'request_failed' ||
        failure.requests.generation !== 1 ||
        failure.requests.embedding !== 0 ||
        failure.privacyOperation !== undefined ||
        failure.privacyCategory !== undefined ||
        failure.privacyStatus !== undefined ||
        failure.privacyInputOrigin !== undefined ||
        failure.privacyLanguageReason !== undefined
    )
        return false;
    const httpFailure =
        failure.code === 'ai_provider_unavailable' &&
        [500, 502, 503].includes(failure.providerStatus ?? 0);
    const timeout =
        policy === TRANSIENT_GENERATION_RETRY_POLICY &&
        failure.generationFailure === 'provider_timeout' &&
        ['ai_request_timeout', 'request_timeout'].includes(failure.code) &&
        (failure.providerStatus === undefined || [408, 504].includes(failure.providerStatus));
    if (failure.generationFailure === 'caller_aborted' || (!httpFailure && !timeout)) return false;
    // A measured generation response is additional evidence against replay.
    return (
        (result.usage?.totals.generation.measuredRequests ?? 0) ===
        (before.usage?.totals.generation.measuredRequests ?? 0)
    );
}
