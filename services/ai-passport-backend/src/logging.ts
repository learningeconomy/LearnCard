import {
    PROVIDER_OPERATIONS,
    PROVIDER_FAILURE_REASONS,
    PROVIDER_STATUSES,
    type ProviderFailureDetails,
} from './ai/provider-diagnostics';
import { INSIGHT_COMPACTION_REASONS } from './services/insightCompaction';
import {
    PRIVACY_INPUT_ORIGINS,
    PRIVACY_LANGUAGE_REASONS,
    PRIVACY_OPERATIONS,
    PRIVACY_CATEGORIES,
    PRIVACY_STATUSES,
} from './ai/privacy-diagnostics';
import { AI_LOCAL_DEBUG_LOGGING, CORS_ORIGINS, DOMAIN, NODE_ENV } from './constants/env';
import { AI_ERROR_CODES } from './ai/errors';
import { isLoopbackOrigin } from './utils/loopback';
import {
    CAUSE_ERRNO_PATTERN,
    LEARNCARD_ERROR_CLASSES,
    LEARNCARD_TRPC_CODES,
    LEARNCARD_CAUSE_KINDS,
    MAX_LEARNCARD_INIT_ATTEMPTS,
    type LearnCardCauseKind,
    type LearnCardErrorClass,
    type LearnCardTrpcCode,
} from './learncard/errors';

type ConsoleLevel = 'debug' | 'error' | 'info' | 'log' | 'warn';
type ConsoleWriter = (...data: unknown[]) => void;

const CONSOLE_METHODS = [
    'debug',
    'error',
    'info',
    'log',
    'warn',
    'assert',
    'dir',
    'dirxml',
    'table',
    'trace',
    'group',
    'groupCollapsed',
    'count',
    'countReset',
    'time',
    'timeLog',
    'timeEnd',
] as const;

// Codes are application-owned constants, never inferred from arbitrary text.
const SAFE_EVENT_CODES = [
    'service_started',
    'service_start_failed',
    'service_runtime_failed',
    'dependency_ready',
    'dependency_failed',
    'ai_operation_failed',
    'ai_insight_failed',
    'ai_insight_completed',
    'ai_insight_started',
    'ai_insight_stage_completed',
    'ai_insight_interrupted',
    'ai_insight_resolution_progress',
    'ai_insight_response_constructed',
    'ai_session_start_failed',
    'ai_provider_circuit_opened',
    'ai_audit_reconciled',
    'ai_audit_reconciliation_failed',
    'ai_privacy_denied',
    'ai_local_processing_failed',
    'auth_verification_failed',
    'auth_verification_warning',
    'request_failed',
    'credential_ingestion_started',
    'credential_ingestion_completed',
    'credential_ingestion_failed',
    'credential_preload_failed',
    'credential_context_failed',
    'credential_context_deferred_completed',
    'learncard_warm_ready',
    'learncard_warm_failed',
    'credential_skipped',
    'credential_batch_completed',
    'credential_raw_unavailable',
    'credential_verification_failed',
    'credential_reconciliation_completed',
    'background_job_failed',
    'data_erasure_completed',
    'data_erasure_needs_attention',
    'file_processing_completed',
    'file_processing_failed',
    'data_erasure_reconciliation_failed',
] as const;

const CREDENTIAL_BATCHES = ['preload', 'context', 'thread_context', 'ingestion'] as const;
const MAX_BATCH_POSITION = 10_000;
const CREDENTIAL_CONTEXT_STAGES = [
    'refresh',
    'ingestion_wait',
    'search',
    'store',
    'complete',
] as const;
const CREDENTIAL_CONTEXT_OUTCOMES = ['ready', 'empty', 'timeout', 'aborted', 'error'] as const;

const SAFE_FAILURE_CODES = [
    ...AI_ERROR_CODES,
    'consent_denied',
    'audit_unavailable',
    'credential_verification_unavailable',
    'credential_invalid',
    'credential_projection_failed',
    'learncard_subject_not_found',
    'learncard_unavailable',
    'learncard_unauthorized',
    'learncard_timeout',
    'no_eligible_insight_inputs',
    'insight_compaction_unavailable',
    'guardrail_unavailable',
    'guardrail_configuration',
    'unsupported_language',
    'owner_operation_unavailable',
    'invalid_provider_response',
    'provider_request_rejected',
    'provider_resource_not_found',
    'provider_access_denied',
    'request_timeout',
    'request_aborted',
    'unknown',
    'INPUT_INVALID',
    'FILE_TOO_LARGE',
    'READ_FAILED',
    'NO_READABLE_TEXT',
    'CONTENT_REJECTED',
    'CLASSIFICATION_FAILED',
    'MODEL_FAILED',
    'CONSTRUCTION_FAILED',
    'ZERO_STRUCTURED_ITEMS',
    'OK',
    'CONSENT_DENIED',
    'OWNER_OPERATION_UNAVAILABLE',
] as const;

export const AI_INSIGHT_STAGES = [
    'request',
    'consent',
    'credential_resolution',
    'credential_verification',
    'snapshot',
    'cache_read',
    'coordination',
    'privacy_filter',
    'evidence_compaction',
    'privacy_restore',
    'audit',
    'generation',
    'issuance',
    'storage',
    'response_assembly',
    'complete',
] as const;
export type AiInsightStage = (typeof AI_INSIGHT_STAGES)[number];

export const VERIFICATION_ORIGINS = ['source', 'generated'] as const;
export const VERIFICATION_SUBREASONS = [
    'sdk_exception',
    'sdk_timeout',
    'read_empty',
    'result_schema',
    'unrecognized_verifier_error',
    'proof_not_confirmed',
] as const;
// Fixed buckets for the verifier strings behind unrecognized_verifier_error.
// The raw strings can carry claims and resolver URLs, so only the bucket is
// logged. See classifyVerifierErrors in credentials/verification.ts.
export const VERIFIER_ERROR_KINDS = [
    'boost_authenticity_exception',
    'did_resolution',
    'jsonld_context',
    'undefined_jsonld_term',
    'status_list',
    'other',
] as const;
export type VerifierErrorKind = (typeof VERIFIER_ERROR_KINDS)[number];
export type VerificationOrigin = (typeof VERIFICATION_ORIGINS)[number];
export type VerificationSubreason = (typeof VERIFICATION_SUBREASONS)[number];

export const RESOLUTION_OPERATIONS = [
    'sdk_init',
    'read',
    'projection',
    'store_verification',
    'store_raw',
] as const;
export type ResolutionOperation = (typeof RESOLUTION_OPERATIONS)[number];
export const RESOLUTION_ERROR_CLASSES = [
    'MongoServerError',
    'MongoNetworkError',
    'MongoServerSelectionError',
    'MongoOperationTimeoutError',
    'MongoWriteConcernError',
    'MongoError',
    'ZodError',
    'TypeError',
    'SyntaxError',
    'AiConsentError',
    'DataErasureRequestedError',
    'Error',
    'unknown',
] as const;
export const SAFE_MONGO_CODES = [50, 91, 112, 189, 244, 251, 262, 11000, 11600, 11602] as const;
export const SAFE_MONGO_LABELS = [
    'TransientTransactionError',
    'UnknownTransactionCommitResult',
    'RetryableWriteError',
] as const;

export const AI_INSIGHT_TIMINGS = [
    'sdk_init',
    'read',
    'projection',
    'store_verification',
    'store_raw',
    'consent_check',
    'verification',
    'owner_queue_wait',
    'owner_preflight',
    'owner_transaction',
] as const;
export type AiInsightTiming = (typeof AI_INSIGHT_TIMINGS)[number];
export type AiInsightTimingTotals = Partial<
    Record<AiInsightTiming, { count: number; active: number; durationMs: number }>
>;

export type SafeLogEventCode = (typeof SAFE_EVENT_CODES)[number];
export type SafeLogMetrics = Partial<ProviderFailureDetails> & {
    stage?: AiInsightStage;
    lastCompletedStage?: AiInsightStage;
    elapsedMs?: number;
    timings?: AiInsightTimingTotals;
    observation?: 'request_signal_aborted' | 'timeout_error';
    compactionReason?: (typeof INSIGHT_COMPACTION_REASONS)[number];
    privacyOperation?: (typeof PRIVACY_OPERATIONS)[number];
    privacyCategory?: (typeof PRIVACY_CATEGORIES)[number];
    privacyStatus?: number;
    privacyInputOrigin?: (typeof PRIVACY_INPUT_ORIGINS)[number];
    privacyLanguageReason?: (typeof PRIVACY_LANGUAGE_REASONS)[number];
    resolutionOperation?: ResolutionOperation;
    errorClass?: (typeof RESOLUTION_ERROR_CLASSES)[number];
    mongoCode?: number;
    mongoLabels?: (typeof SAFE_MONGO_LABELS)[number][];
    diagnosticId?: string;
    verificationOrigin?: VerificationOrigin;
    verificationSubreason?: VerificationSubreason;
    verifierErrorKind?: VerifierErrorKind;
    count?: number;
    durationMs?: number;
    httpStatus?: number;
    success?: boolean;
    provider?: 'openai' | 'anthropic' | 'google' | 'bedrock';
    failureCode?: (typeof SAFE_FAILURE_CODES)[number];
    operationId?: string;
    attemptId?: string;
    attempt?: number;
    fileStage?: string;
    outcome?: string;
    sizeBucket?: string;
    fileType?: string;
    detectedFileType?: string;
    pipelineVersion?: string;
    model?: string;
    ocrModel?: string;
    /** LearnCard cause fields; see LearnCardFailureDetail. */
    learncardErrorClass?: LearnCardErrorClass;
    trpcCode?: LearnCardTrpcCode;
    causeErrno?: string;
    causeKind?: LearnCardCauseKind;
    initAttempts?: number;
    contextPhase?: 'opening' | 'deferred';
    /** credential_context_failed / _deferred_completed: ranked candidates. */
    candidateCount?: number;
    /** credential_context_deferred_completed: how it ended and how far it got. */
    contextOutcome?: (typeof CREDENTIAL_CONTEXT_OUTCOMES)[number];
    contextStage?: (typeof CREDENTIAL_CONTEXT_STAGES)[number];
    /** credential_skipped / credential_batch_completed: position and counts only. */
    credentialBatch?: (typeof CREDENTIAL_BATCHES)[number];
    index?: number;
    loadedCount?: number;
    skippedCount?: number;
};

const FILE_STAGES: Record<string, true> = {
    input: true,
    read: true,
    classify: true,
    extract: true,
    construct: true,
    complete: true,
};
const FILE_OUTCOMES: Record<string, true> = {
    success: true,
    empty: true,
    failed: true,
};
const FILE_SIZE_BUCKETS: Record<string, true> = {
    under_100kb: true,
    under_1mb: true,
    under_4mb: true,
    over_4mb: true,
};
const FILE_KINDS: Record<string, true> = {
    resume: true,
    certificate: true,
    transcript: true,
    diploma: true,
};

const trustedEvents = new WeakSet<object>();

/** Emit bounded structured metadata, never errors, free text, or user objects. */
export const logSafeEvent = (
    level: ConsoleLevel,
    code: SafeLogEventCode,
    metrics: SafeLogMetrics = {}
): void => {
    if (!SAFE_EVENT_CODES.includes(code)) throw new Error('Unknown safe log event code');
    const event: { event: SafeLogEventCode } & SafeLogMetrics = { event: code };
    // Read only explicitly named scalar fields. Extra properties and object keys
    // are not copied, and getters/proxies cannot supply objects to the sink.
    for (const field of ['count', 'durationMs', 'httpStatus'] as const) {
        const value = metrics[field];
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0) event[field] = value;
    }
    if (code === 'file_processing_completed' || code === 'file_processing_failed') {
        if (!Number.isInteger(event.count) || (event.count ?? 0) > 10_000) delete event.count;
        if (!Number.isInteger(event.durationMs) || (event.durationMs ?? 0) > 3_600_000)
            delete event.durationMs;
        if (
            !Number.isInteger(event.httpStatus) ||
            (event.httpStatus ?? 0) < 100 ||
            (event.httpStatus ?? 0) > 599
        )
            delete event.httpStatus;
        if (
            typeof metrics.operationId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                metrics.operationId
            )
        )
            event.operationId = metrics.operationId;
        if (
            typeof metrics.attemptId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                metrics.attemptId
            )
        )
            event.attemptId = metrics.attemptId;
        if (Number.isInteger(metrics.attempt) && metrics.attempt! >= 1 && metrics.attempt! <= 100)
            event.attempt = metrics.attempt;
        if (metrics.fileStage && Object.hasOwn(FILE_STAGES, metrics.fileStage))
            event.fileStage = metrics.fileStage;
        if (metrics.outcome && Object.hasOwn(FILE_OUTCOMES, metrics.outcome))
            event.outcome = metrics.outcome;
        if (metrics.sizeBucket && Object.hasOwn(FILE_SIZE_BUCKETS, metrics.sizeBucket))
            event.sizeBucket = metrics.sizeBucket;
        if (metrics.fileType && Object.hasOwn(FILE_KINDS, metrics.fileType))
            event.fileType = metrics.fileType;
        if (metrics.detectedFileType && Object.hasOwn(FILE_KINDS, metrics.detectedFileType))
            event.detectedFileType = metrics.detectedFileType;
        if (metrics.pipelineVersion === 'file-extraction-v1')
            event.pipelineVersion = metrics.pipelineVersion;
        if (metrics.model === 'us.openai.gpt-6-luna' || metrics.model === 'us.openai.gpt-6.1-sol')
            event.model = metrics.model;
        if (metrics.ocrModel === 'tesseract-local') event.ocrModel = metrics.ocrModel;
    }
    if (code === 'ai_insight_response_constructed' && ![200, 204].includes(event.httpStatus ?? 0))
        delete event.httpStatus;
    const provider = metrics.provider;
    const success = metrics.success;
    if (typeof success === 'boolean') event.success = success;
    if (
        provider === 'openai' ||
        provider === 'anthropic' ||
        provider === 'google' ||
        provider === 'bedrock'
    )
        event.provider = provider;
    const failureCode = metrics.failureCode;
    if (failureCode !== undefined && SAFE_FAILURE_CODES.includes(failureCode))
        event.failureCode = failureCode;
    if (
        [
            'ai_insight_failed',
            'ai_insight_completed',
            'ai_insight_started',
            'ai_insight_stage_completed',
            'ai_insight_interrupted',
            'ai_insight_resolution_progress',
            'ai_insight_response_constructed',
        ].includes(code)
    ) {
        if (metrics.stage && AI_INSIGHT_STAGES.includes(metrics.stage)) event.stage = metrics.stage;
        if (
            typeof metrics.diagnosticId === 'string' &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
                metrics.diagnosticId
            )
        )
            event.diagnosticId = metrics.diagnosticId;
    }
    if (
        [
            'ai_insight_started',
            'ai_insight_stage_completed',
            'ai_insight_interrupted',
            'ai_insight_resolution_progress',
            'ai_insight_response_constructed',
        ].includes(code)
    ) {
        if (
            typeof metrics.elapsedMs === 'number' &&
            Number.isInteger(metrics.elapsedMs) &&
            metrics.elapsedMs >= 0 &&
            metrics.elapsedMs <= 86_400_000
        )
            event.elapsedMs = metrics.elapsedMs;
        if (metrics.lastCompletedStage && AI_INSIGHT_STAGES.includes(metrics.lastCompletedStage))
            event.lastCompletedStage = metrics.lastCompletedStage;
        if (
            code === 'ai_insight_interrupted' &&
            (metrics.observation === 'request_signal_aborted' ||
                metrics.observation === 'timeout_error')
        )
            event.observation = metrics.observation;
        if (
            code === 'ai_insight_stage_completed' &&
            (!Number.isInteger(event.count) || !event.count || event.count > 3)
        )
            delete event.count;
    }
    if (code === 'ai_insight_resolution_progress' && metrics.timings) {
        const totals: AiInsightTimingTotals = {};
        for (const name of AI_INSIGHT_TIMINGS) {
            const value = metrics.timings[name];
            if (
                value &&
                [value.count, value.active, value.durationMs].every(
                    numeric =>
                        typeof numeric === 'number' &&
                        Number.isInteger(numeric) &&
                        numeric >= 0 &&
                        numeric <= 86_400_000
                )
            )
                totals[name] = {
                    count: value.count,
                    active: value.active,
                    durationMs: value.durationMs,
                };
        }
        event.timings = totals;
    }
    if (code === 'ai_insight_failed' && event.stage === 'credential_verification') {
        if (metrics.verificationOrigin && VERIFICATION_ORIGINS.includes(metrics.verificationOrigin))
            event.verificationOrigin = metrics.verificationOrigin;
        if (
            event.failureCode === 'credential_verification_unavailable' &&
            metrics.verificationSubreason &&
            VERIFICATION_SUBREASONS.includes(metrics.verificationSubreason)
        )
            event.verificationSubreason = metrics.verificationSubreason;
    }
    if (
        code === 'ai_insight_failed' &&
        metrics.resolutionOperation &&
        RESOLUTION_OPERATIONS.includes(metrics.resolutionOperation)
    ) {
        event.resolutionOperation = metrics.resolutionOperation;
        if (metrics.errorClass && RESOLUTION_ERROR_CLASSES.includes(metrics.errorClass))
            event.errorClass = metrics.errorClass;
        if (
            typeof metrics.mongoCode === 'number' &&
            SAFE_MONGO_CODES.includes(metrics.mongoCode as (typeof SAFE_MONGO_CODES)[number])
        )
            event.mongoCode = metrics.mongoCode;
        if (Array.isArray(metrics.mongoLabels))
            event.mongoLabels = [
                ...new Set(metrics.mongoLabels.filter(label => SAFE_MONGO_LABELS.includes(label))),
            ].slice(0, SAFE_MONGO_LABELS.length);
    }
    if (
        code === 'ai_insight_failed' &&
        metrics.privacyOperation &&
        PRIVACY_OPERATIONS.includes(metrics.privacyOperation)
    ) {
        event.privacyOperation = metrics.privacyOperation;
        if (
            metrics.privacyInputOrigin &&
            PRIVACY_INPUT_ORIGINS.includes(metrics.privacyInputOrigin)
        )
            event.privacyInputOrigin = metrics.privacyInputOrigin;
        if (
            metrics.privacyLanguageReason &&
            PRIVACY_LANGUAGE_REASONS.includes(metrics.privacyLanguageReason)
        )
            event.privacyLanguageReason = metrics.privacyLanguageReason;
        if (metrics.privacyCategory && PRIVACY_CATEGORIES.includes(metrics.privacyCategory))
            event.privacyCategory = metrics.privacyCategory;
        if (
            typeof metrics.privacyStatus === 'number' &&
            PRIVACY_STATUSES.includes(metrics.privacyStatus as never)
        )
            event.privacyStatus = metrics.privacyStatus;
    }
    if (
        code === 'ai_insight_failed' &&
        event.failureCode === 'insight_compaction_unavailable' &&
        metrics.compactionReason &&
        INSIGHT_COMPACTION_REASONS.includes(metrics.compactionReason)
    )
        event.compactionReason = metrics.compactionReason;
    if (code === 'ai_insight_failed' && event.stage === 'generation') {
        if (metrics.providerOperation && PROVIDER_OPERATIONS.includes(metrics.providerOperation))
            event.providerOperation = metrics.providerOperation;
        if (
            metrics.providerFailureReason &&
            PROVIDER_FAILURE_REASONS.includes(metrics.providerFailureReason)
        )
            event.providerFailureReason = metrics.providerFailureReason;
        if (PROVIDER_STATUSES.some(status => status === metrics.providerStatus))
            event.providerStatus = metrics.providerStatus;
    }
    if (code === 'credential_skipped' || code === 'credential_batch_completed') {
        if (metrics.credentialBatch && CREDENTIAL_BATCHES.includes(metrics.credentialBatch))
            event.credentialBatch = metrics.credentialBatch;
        for (const field of ['index', 'loadedCount', 'skippedCount'] as const) {
            const value = metrics[field];
            if (
                typeof value === 'number' &&
                Number.isInteger(value) &&
                value >= 0 &&
                value <= MAX_BATCH_POSITION
            )
                event[field] = value;
        }
    }
    if (code === 'credential_context_failed' || code === 'credential_context_deferred_completed') {
        const value = metrics.candidateCount;
        if (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= 0 &&
            value <= MAX_BATCH_POSITION
        )
            event.candidateCount = value;
    }
    if (code === 'credential_context_deferred_completed') {
        if (metrics.contextOutcome && CREDENTIAL_CONTEXT_OUTCOMES.includes(metrics.contextOutcome))
            event.contextOutcome = metrics.contextOutcome;
        if (metrics.contextStage && CREDENTIAL_CONTEXT_STAGES.includes(metrics.contextStage))
            event.contextStage = metrics.contextStage;
    }
    if (
        code === 'credential_context_failed' ||
        code === 'credential_preload_failed' ||
        code === 'credential_skipped' ||
        code === 'ai_session_start_failed'
    ) {
        if (
            metrics.learncardErrorClass &&
            LEARNCARD_ERROR_CLASSES.includes(metrics.learncardErrorClass)
        )
            event.learncardErrorClass = metrics.learncardErrorClass;
        if (metrics.trpcCode && LEARNCARD_TRPC_CODES.includes(metrics.trpcCode))
            event.trpcCode = metrics.trpcCode;
        if (typeof metrics.causeErrno === 'string' && CAUSE_ERRNO_PATTERN.test(metrics.causeErrno))
            event.causeErrno = metrics.causeErrno;
        if (metrics.causeKind && LEARNCARD_CAUSE_KINDS.includes(metrics.causeKind))
            event.causeKind = metrics.causeKind;
        if (
            Number.isInteger(metrics.initAttempts) &&
            (metrics.initAttempts ?? 0) >= 1 &&
            (metrics.initAttempts ?? 0) <= MAX_LEARNCARD_INIT_ATTEMPTS
        )
            event.initAttempts = metrics.initAttempts;
        if (metrics.contextPhase === 'opening' || metrics.contextPhase === 'deferred')
            event.contextPhase = metrics.contextPhase;
        if (
            event.failureCode === 'credential_verification_unavailable' &&
            metrics.verificationSubreason &&
            VERIFICATION_SUBREASONS.includes(metrics.verificationSubreason)
        )
            event.verificationSubreason = metrics.verificationSubreason;
        if (
            event.verificationSubreason === 'unrecognized_verifier_error' &&
            metrics.verifierErrorKind &&
            VERIFIER_ERROR_KINDS.includes(metrics.verifierErrorKind)
        )
            event.verifierErrorKind = metrics.verifierErrorKind;
        if (
            !Number.isInteger(event.httpStatus) ||
            (event.httpStatus ?? 0) < 100 ||
            (event.httpStatus ?? 0) > 599
        )
            delete event.httpStatus;
    }
    Object.freeze(event);
    trustedEvents.add(event);
    console[level](event);
};

let restoreProductionLogging: (() => void) | undefined;

/**
 * Suppress untrusted console output in every deployed environment. Raw debug
 * requires an explicit opt-in AND local deployment origins AND a nonproduction
 * runtime; a flag or caller-supplied environment alone cannot disable policy.
 */
export const configureProductionLogging = (environment = NODE_ENV): (() => void) => {
    if (restoreProductionLogging) return restoreProductionLogging;
    if (
        AI_LOCAL_DEBUG_LOGGING &&
        (NODE_ENV === 'development' || NODE_ENV === 'test') &&
        environment === NODE_ENV &&
        isLoopbackOrigin(DOMAIN) &&
        CORS_ORIGINS.length > 0 &&
        CORS_ORIGINS.every(isLoopbackOrigin)
    )
        return () => undefined;

    const originals = new Map<(typeof CONSOLE_METHODS)[number], ConsoleWriter>();
    const writeLine = console.log.bind(console);
    for (const method of CONSOLE_METHODS) {
        const original = console[method];
        originals.set(method, (...data: unknown[]) => Reflect.apply(original, console, data));
        // Do not call native trace/assert/table/timer formatting: those can append
        // stacks or interpret labels/options. Auxiliary methods become safe lines.
        const writer = ['debug', 'error', 'info', 'log', 'warn'].includes(method)
            ? console[method].bind(console)
            : writeLine;
        console[method] = (...data: unknown[]) => {
            if (method === 'assert' && data[0]) return;
            const argumentsToLog = method === 'assert' ? data.slice(1) : data;
            writer(
                ...argumentsToLog.map(value =>
                    value !== null && typeof value === 'object' && trustedEvents.has(value)
                        ? value
                        : '[redacted]'
                )
            );
        };
    }
    // Fatal runtime defaults can print raw exception objects without using console.
    // Keep their fail-closed exit behavior without exposing dependency payloads.
    const failClosed = () => {
        logSafeEvent('error', 'service_runtime_failed');
        process.exit(1);
    };
    process.on('uncaughtException', failClosed);
    process.on('unhandledRejection', failClosed);

    restoreProductionLogging = () => {
        process.off('uncaughtException', failClosed);
        process.off('unhandledRejection', failClosed);
        for (const [method, writer] of originals) console[method] = writer;
        restoreProductionLogging = undefined;
    };
    return restoreProductionLogging;
};
