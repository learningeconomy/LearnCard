import { EMBEDDING_STOP_REASONS, embeddingStopDetails } from '../ai/embedding-recovery';
import { GENERATION_FAILURES, generationFailureDetails } from '../ai/generation-failure';
import {
    embeddingFailureSchema,
    sanitizeEmbeddingFailure,
    embeddingFailureDetails,
    embeddingFailureSummary,
} from '../ai/embedding-diagnostics';
import { z } from 'zod';
import { AI_ERROR_CODES } from '../ai/errors';
import {
    providerFailureDetails,
    PROVIDER_OPERATIONS,
    PROVIDER_FAILURE_REASONS,
    PROVIDER_STATUSES,
} from '../ai/provider-diagnostics';
import {
    privacyFailureDetails,
    PRIVACY_OPERATIONS,
    PRIVACY_CATEGORIES,
    PRIVACY_STATUSES,
    PRIVACY_INPUT_ORIGINS,
    PRIVACY_LANGUAGE_REASONS,
} from '../ai/privacy-diagnostics';
import type { UsageMeter } from '../ai/usage-meter';

export const BACKFILL_FAILURE_STAGES = [
    'job_guard',
    'source_read',
    'consent',
    'coverage',
    'projection',
    'generation',
    'source_recheck',
    'embedding',
    'final_consent',
    'checkpoint',
] as const;
export type BackfillFailureStage = (typeof BACKFILL_FAILURE_STAGES)[number];
const CODES = [
    ...AI_ERROR_CODES,
    'record_failed',
    'projection_unavailable',
    'consent_unavailable',
    'owner_unavailable',
    'audit_unavailable',
    'privacy_failed',
    'request_timeout',
    'request_aborted',
    'provider_access_denied',
    'provider_request_rejected',
    'provider_throttled',
    'provider_unavailable',
] as const;
const count = z.number().int().min(0).max(1_000_000);
const OPTIONAL_FAILURE_FIELDS = new Set([
    'embeddingStop',
    'generationFailure',
    'embeddingFailure',
    'providerOperation',
    'providerFailureReason',
    'providerStatus',
    'privacyOperation',
    'privacyCategory',
    'privacyStatus',
    'privacyInputOrigin',
    'privacyLanguageReason',
]);
export const GENERIC_BACKFILL_PAUSE_REASON =
    'Record failed or result uncertain; inspect progress before explicit resume';
const schema = z
    .object({
        version: z.literal(1),
        at: z.string().max(32).datetime(),
        record: z.number().int().min(1).max(10_000),
        stage: z.enum(BACKFILL_FAILURE_STAGES),
        code: z.enum(CODES),
        dispatchStatus: z.enum(['not_dispatched', 'possibly_dispatched']),
        requests: z.object({ generation: count, embedding: count, privacy: count }).strict(),
        embeddingStop: z.enum(EMBEDDING_STOP_REASONS).optional(),
        generationFailure: z.enum(GENERATION_FAILURES).optional(),
        embeddingFailure: embeddingFailureSchema.optional(),
        providerOperation: z.enum(PROVIDER_OPERATIONS).optional(),
        providerFailureReason: z.enum(PROVIDER_FAILURE_REASONS).optional(),
        providerStatus: z
            .number()
            .refine(value => PROVIDER_STATUSES.includes(value as never))
            .optional(),
        privacyOperation: z.enum(PRIVACY_OPERATIONS).optional(),
        privacyCategory: z.enum(PRIVACY_CATEGORIES).optional(),
        privacyStatus: z
            .number()
            .refine(value => PRIVACY_STATUSES.includes(value as never))
            .optional(),
        privacyInputOrigin: z.enum(PRIVACY_INPUT_ORIGINS).optional(),
        privacyLanguageReason: z.enum(PRIVACY_LANGUAGE_REASONS).optional(),
    })
    .strict();
export type BackfillFailure = z.infer<typeof schema>;
const own = (value: unknown, key: string): unknown => {
    try {
        return value && typeof value === 'object'
            ? Object.getOwnPropertyDescriptor(value, key)?.value
            : undefined;
    } catch {
        return undefined;
    }
};

/** Bound at both persistence and presentation. No error text, identifiers or accessors. */
export function sanitizeBackfillFailure(value: unknown): BackfillFailure | undefined {
    const candidate: Record<string, unknown> = {};
    for (const key of Object.keys(schema.shape)) {
        const field = own(value, key);
        // Mongo's default BSON options encode undefined properties as null.
        // Recover only absent optional metadata, and omit it from future writes.
        if (OPTIONAL_FAILURE_FIELDS.has(key) && (field === null || field === undefined)) continue;
        if (key === 'embeddingFailure') {
            const safe = sanitizeEmbeddingFailure(field);
            if (safe) candidate[key] = safe;
        } else candidate[key] = field;
    }
    candidate.requests = Object.fromEntries(
        ['generation', 'embedding', 'privacy'].map(kind => [
            kind,
            own(own(value, 'requests'), kind),
        ])
    );
    const parsed = schema.safeParse(candidate);
    if (!parsed.success) return undefined;
    const result = parsed.data;
    if (
        result.dispatchStatus === 'not_dispatched' &&
        (Object.values(result.requests).some(value => value > 0) ||
            ['generation', 'source_recheck', 'embedding', 'final_consent'].includes(result.stage))
    )
        return undefined;
    return result;
}

export function createBackfillFailure(
    error: unknown,
    attempt: {
        stage: BackfillFailureStage;
        record: number;
        providerPipelineEntered: boolean;
        meter?: UsageMeter;
    }
): BackfillFailure | undefined {
    const privacy = privacyFailureDetails(error);
    const provider = providerFailureDetails(error);
    const names: Record<string, BackfillFailure['code']> = {
        AiConsentError: 'consent_unavailable',
        DataErasureRequestedError: 'owner_unavailable',
        AiAuditPersistenceError: 'audit_unavailable',
        BedrockPrivacyError: 'privacy_failed',
        BedrockConfigurationError: 'privacy_failed',
        UnsupportedPrivacyLanguageError: 'privacy_failed',
        TimeoutError: 'request_timeout',
        AbortError: 'request_aborted',
        AccessDeniedException: 'provider_access_denied',
        UnrecognizedClientException: 'provider_access_denied',
        ValidationException: 'provider_request_rejected',
        ThrottlingException: 'provider_throttled',
        TooManyRequestsException: 'provider_throttled',
        ServiceUnavailableException: 'provider_unavailable',
        InternalServerException: 'provider_unavailable',
    };
    const name = own(error, 'name');
    const suppliedCode = own(error, 'code');
    const code =
        name === 'AiProviderError' && AI_ERROR_CODES.includes(suppliedCode as never)
            ? suppliedCode
            : typeof name === 'string' && Object.hasOwn(names, name)
              ? names[name]
              : privacy
                ? 'privacy_failed'
                : attempt.stage === 'projection'
                  ? 'projection_unavailable'
                  : 'record_failed';
    const requests = {
        generation: attempt.meter?.generation.requests ?? 0,
        embedding: attempt.meter?.embedding.requests ?? 0,
        privacy: attempt.meter?.privacy.requests ?? 0,
    };
    const embeddingFailure = embeddingFailureDetails(error);
    const generationFailure = generationFailureDetails(error);
    const embeddingStop = embeddingStopDetails(error);
    const base = {
        version: 1,
        at: new Date().toISOString(),
        record: attempt.record,
        stage: attempt.stage,
        code,
        // Entry is conservative: reservations/SDK failures need not prove egress.
        // This describes this attempt only, never earlier retries or billed usage.
        dispatchStatus:
            attempt.providerPipelineEntered || Object.values(requests).some(value => value > 0)
                ? 'possibly_dispatched'
                : 'not_dispatched',
        requests,
    };
    return (
        sanitizeBackfillFailure({
            ...base,
            ...provider,
            ...privacy,
            ...(embeddingStop ? { embeddingStop } : {}),
            ...(generationFailure ? { generationFailure } : {}),
            ...(embeddingFailure ? { embeddingFailure } : {}),
        }) ?? sanitizeBackfillFailure(base)
    );
}

export function backfillPauseReason(value: unknown): string {
    const failure = sanitizeBackfillFailure(value);
    if (!failure) return GENERIC_BACKFILL_PAUSE_REASON;
    const category =
        failure.privacyCategory ??
        (failure.code === 'record_failed'
            ? (failure.providerFailureReason ?? failure.code)
            : failure.code);
    const dispatch =
        failure.dispatchStatus === 'not_dispatched'
            ? 'No provider request started in this attempt'
            : 'Provider requests may have been attempted';
    const status = failure.privacyStatus ?? failure.providerStatus;
    const stop = failure.embeddingStop
        ? (
              {
                  record_deadline: 'Embedding record deadline exhausted.',
                  retry_deadline: 'Embedding retry backoff cannot fit the record deadline.',
                  attempts_exhausted: 'Embedding attempt limit exhausted.',
              } as const
          )[failure.embeddingStop]
        : undefined;
    const detail = [stop, embeddingFailureSummary(failure.embeddingFailure)]
        .filter(Boolean)
        .join(' ');
    return `Record ${failure.record} paused at ${failure.stage.replaceAll('_', ' ')} (${category.replaceAll('_', ' ')}${status ? `; HTTP ${status}` : ''}). ${dispatch}; explicit resume required.${detail ? ` ${detail}` : ''}`;
}

/** Keep one safe attempt failure with observed dispatches, never a raw exception. */
export function retainDispatchedFailure(
    current: unknown,
    previous: unknown,
    record: number
): BackfillFailure | undefined {
    for (const value of [current, previous]) {
        const failure = sanitizeBackfillFailure(value);
        if (failure?.record === record && Object.values(failure.requests).some(count => count > 0))
            return failure;
    }
    return undefined;
}
