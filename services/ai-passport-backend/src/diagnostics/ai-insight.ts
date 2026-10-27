import { providerFailureDetails } from '../ai/provider-diagnostics';
import { privacyFailureDetails } from '../ai/privacy-diagnostics';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { AI_ERROR_CODES, AiProviderError } from '../ai/errors';
import {
    MongoError,
    MongoServerError,
    MongoNetworkError,
    MongoServerSelectionError,
    MongoOperationTimeoutError,
    MongoWriteConcernError,
} from 'mongodb';
import { ZodError } from 'zod';
import type {
    AiInsightStage,
    SafeLogMetrics,
    ResolutionOperation,
    AiInsightTiming,
    AiInsightTimingTotals,
} from '../logging';

const context = new AsyncLocalStorage<{
    diagnosticId: string;
    reported: Set<unknown>;
    responseConstructed?: boolean;
    resolutionOperation?: ResolutionOperation;
    stages: AiInsightStage[];
    progress: {
        started: number;
        completions: Set<AiInsightStage>;
        interruptions: Set<NonNullable<SafeLogMetrics['observation']>>;
        lastCompletedStage?: AiInsightStage;
        timings: AiInsightTimingTotals;
        resolutionActive: number;
        snapshots: number;
    };
    emit: typeof import('../logging').logSafeEvent;
}>();

// Fixed budget: at most one completion per stage, eight failures and two
// interruption observations. Never emit one progress event per credential.
const elapsed = (started: number) =>
    Math.min(86_400_000, Math.max(0, Math.round(performance.now() - started)));
const observeInterruption = (
    active: NonNullable<ReturnType<typeof context.getStore>>,
    observation: NonNullable<SafeLogMetrics['observation']>
) => {
    if (active.progress.interruptions.has(observation)) return;
    active.progress.interruptions.add(observation);
    try {
        active.emit('info', 'ai_insight_interrupted', {
            diagnosticId: active.diagnosticId,
            stage: 'request',
            observation,
            elapsedMs: elapsed(active.progress.started),
            lastCompletedStage: active.progress.lastCompletedStage,
        });
    } catch {
        /* Diagnostics cannot change cancellation or execution. */
    }
};

// Cumulative completed timings may overlap because reads and verification stay
// concurrent. Active counts distinguish waiting work from completed operations.
export const beginAiInsightTiming = (operation: AiInsightTiming): (() => void) => {
    const active = context.getStore();
    if (!active) return () => {};
    const total = (active.progress.timings[operation] ??= {
        count: 0,
        active: 0,
        durationMs: 0,
    });
    total.active += 1;
    const started = performance.now();
    let finished = false;
    return () => {
        if (finished) return;
        finished = true;
        total.active -= 1;
        total.count = Math.min(86_400_000, total.count + 1);
        total.durationMs = Math.min(86_400_000, total.durationMs + elapsed(started));
    };
};
export const withAiInsightTiming = async <Result>(
    operation: AiInsightTiming,
    callback: () => Result | Promise<Result>
): Promise<Result> => {
    const finish = beginAiInsightTiming(operation);
    try {
        return await callback();
    } finally {
        finish();
    }
};
const emitResolutionProgress = (
    active: NonNullable<ReturnType<typeof context.getStore>>,
    final = false
) => {
    // Five periodic snapshots plus one outer-resolution boundary snapshot.
    if (!final && active.progress.snapshots >= 5) return;
    active.progress.snapshots += 1;
    try {
        active.emit('info', 'ai_insight_resolution_progress', {
            diagnosticId: active.diagnosticId,
            stage: 'credential_resolution',
            elapsedMs: elapsed(active.progress.started),
            timings: active.progress.timings,
        });
    } catch {
        /* Timings cannot change execution. */
    }
};

// Inspect only a data property, never error text, causes, stacks or accessors.
// These labels inform diagnostics only; they never authorize an operation.
const classifications = new Map<string, SafeLogMetrics['failureCode']>([
    ['AiConsentError', 'consent_denied'],
    ['DataErasureRequestedError', 'owner_operation_unavailable'],
    ['NoEligibleInsightInputsError', 'no_eligible_insight_inputs'],
    ['InsightCompactionError', 'insight_compaction_unavailable'],
    ['CredentialVerificationUnavailableError', 'credential_verification_unavailable'],
    ['AiAuditPersistenceError', 'audit_unavailable'],
    ['BedrockPrivacyError', 'guardrail_unavailable'],
    ['BedrockConfigurationError', 'guardrail_configuration'],
    ['UnsupportedPrivacyLanguageError', 'unsupported_language'],
    ['TimeoutError', 'request_timeout'],
]);
const classify = (error: unknown): SafeLogMetrics['failureCode'] => {
    try {
        if (error instanceof AiProviderError && AI_ERROR_CODES.includes(error.code))
            return error.code;
        if (error && typeof error === 'object') {
            const name = Object.getOwnPropertyDescriptor(error, 'name')?.value;
            if (typeof name === 'string') return classifications.get(name) ?? 'unknown';
        }
    } catch {
        /* Hostile error objects cannot disrupt the original failure. */
    }
    return 'unknown';
};

// Read only known prototypes and own scalar/set properties. Never invoke error
// getters, user methods, messages, causes or toJSON while producing diagnostics.
const resolutionErrorMetadata = (
    error: unknown
): Pick<SafeLogMetrics, 'errorClass' | 'mongoCode' | 'mongoLabels'> => {
    const safe: Pick<SafeLogMetrics, 'errorClass' | 'mongoCode' | 'mongoLabels'> = {
        errorClass: 'unknown',
    };
    try {
        if (error instanceof MongoError) {
            safe.errorClass =
                error instanceof MongoWriteConcernError
                    ? 'MongoWriteConcernError'
                    : error instanceof MongoServerError
                      ? 'MongoServerError'
                      : error instanceof MongoNetworkError
                        ? 'MongoNetworkError'
                        : error instanceof MongoServerSelectionError
                          ? 'MongoServerSelectionError'
                          : error instanceof MongoOperationTimeoutError
                            ? 'MongoOperationTimeoutError'
                            : 'MongoError';
            const code = Object.getOwnPropertyDescriptor(error, 'code')?.value;
            // Final sink applies the numeric code allowlist.
            if (typeof code === 'number') safe.mongoCode = code;
            const labels = Object.getOwnPropertyDescriptor(error, 'errorLabelSet')?.value;
            if (labels instanceof Set)
                safe.mongoLabels = [
                    'TransientTransactionError',
                    'UnknownTransactionCommitResult',
                    'RetryableWriteError',
                ].filter(label => Set.prototype.has.call(labels, label)) as NonNullable<
                    SafeLogMetrics['mongoLabels']
                >;
        } else if (error instanceof ZodError) safe.errorClass = 'ZodError';
        else if (error instanceof TypeError) safe.errorClass = 'TypeError';
        else if (error instanceof SyntaxError) safe.errorClass = 'SyntaxError';
        else if (error instanceof Error) {
            const name = Object.getOwnPropertyDescriptor(error, 'name')?.value;
            safe.errorClass =
                name === 'AiConsentError' || name === 'DataErasureRequestedError' ? name : 'Error';
        }
    } catch {
        /* Hostile error objects cannot disrupt the original failure. */
    }
    return safe;
};

export const withAiInsightResolutionOperation = <Result>(
    operation: ResolutionOperation,
    callback: () => Result | Promise<Result>
): Promise<Result> => {
    const active = context.getStore();
    if (!active) return Promise.resolve().then(callback);
    return context.run({ ...active, resolutionOperation: operation }, () =>
        withAiInsightStage('credential_resolution', () => withAiInsightTiming(operation, callback))
    );
};

export const withAiInsightStage = async <Result>(
    stage: AiInsightStage,
    callback: () => Result | Promise<Result>,
    verificationOrigin?: SafeLogMetrics['verificationOrigin']
): Promise<Result> => {
    const active = context.getStore();
    if (!active) return callback();
    const started = performance.now();
    const outerResolution =
        stage === 'credential_resolution' && !active.stages.includes('credential_resolution');
    if (outerResolution) active.progress.resolutionActive += 1;
    try {
        const result = await context.run(
            { ...active, stages: [...active.stages, stage] },
            callback
        );
        // The outer batch owns resolution progress. Suppress its per-input children.
        if (
            stage !== 'request' &&
            stage !== 'complete' &&
            !active.stages.includes('credential_resolution')
        ) {
            active.progress.lastCompletedStage = stage;
            if (!active.progress.completions.has(stage)) {
                active.progress.completions.add(stage);
                try {
                    active.emit('info', 'ai_insight_stage_completed', {
                        diagnosticId: active.diagnosticId,
                        stage,
                        count: 1,
                        durationMs: elapsed(started),
                        elapsedMs: elapsed(active.progress.started),
                    });
                } catch {
                    /* Diagnostics must not change the result. */
                }
            }
        }
        return result;
    } catch (error) {
        if (!active.reported.has(error) && active.reported.size < 8) {
            active.reported.add(error);
            try {
                const failureCode = classify(error);
                if (failureCode === 'request_timeout' || failureCode === 'ai_request_timeout')
                    observeInterruption(active, 'timeout_error');
                // The verifier supplies a fixed data property; never inspect SDK errors.
                const verificationSubreason =
                    stage === 'credential_verification' &&
                    failureCode === 'credential_verification_unavailable' &&
                    error &&
                    typeof error === 'object'
                        ? Object.getOwnPropertyDescriptor(error, 'verificationSubreason')?.value
                        : undefined;
                active.emit('error', 'ai_insight_failed', {
                    diagnosticId: active.diagnosticId,
                    stage,
                    failureCode,
                    verificationOrigin,
                    verificationSubreason,
                    ...privacyFailureDetails(error),
                    ...providerFailureDetails(error),
                    compactionReason:
                        failureCode === 'insight_compaction_unavailable' &&
                        error &&
                        typeof error === 'object'
                            ? Object.getOwnPropertyDescriptor(error, 'reason')?.value
                            : undefined,
                    ...(active.resolutionOperation
                        ? {
                              resolutionOperation: active.resolutionOperation,
                              ...resolutionErrorMetadata(error),
                          }
                        : {}),
                    success: false,
                });
            } catch {
                /* Logging must not replace the original failure. */
            }
        }
        throw error;
    } finally {
        if (outerResolution) {
            active.progress.resolutionActive -= 1;
            if (active.progress.resolutionActive === 0 && active.progress.snapshots < 6)
                emitResolutionProgress(active, true);
        }
    }
};

/** Construction only: Bun/Fly provides no client delivery acknowledgement here. */
export const observeAiInsightResponseConstructed = (status: number): void => {
    const active = context.getStore();
    if (!active || active.responseConstructed || ![200, 204].includes(status)) return;
    active.responseConstructed = true;
    try {
        active.emit('info', 'ai_insight_response_constructed', {
            diagnosticId: active.diagnosticId,
            stage: 'response_assembly',
            httpStatus: status,
            elapsedMs: elapsed(active.progress.started),
        });
    } catch {
        /* Construction diagnostics cannot change the response. */
    }
};

/** Server-generated correlation is confined to logs; public responses stay unchanged. */
export const runAiInsightDiagnostics = async <Result>(
    callback: () => Promise<Result>,
    options: { signal?: AbortSignal } = {}
): Promise<Result> => {
    // Keep logging dependencies out of unrelated consent/verification callers.
    let emit: typeof import('../logging').logSafeEvent;
    try {
        ({ logSafeEvent: emit } = await import('../logging'));
    } catch {
        return callback();
    }
    const started = performance.now();
    const active = {
        diagnosticId: randomUUID(),
        reported: new Set<unknown>(),
        emit,
        stages: [] as AiInsightStage[],
        progress: {
            started,
            completions: new Set<AiInsightStage>(),
            interruptions: new Set<NonNullable<SafeLogMetrics['observation']>>(),
            timings: {} as AiInsightTimingTotals,
            resolutionActive: 0,
            snapshots: 0,
        },
    };
    return context.run(active, async () => {
        try {
            emit('info', 'ai_insight_started', {
                diagnosticId: active.diagnosticId,
                stage: 'request',
                elapsedMs: 0,
            });
        } catch {
            /* Logging must not change the response. */
        }
        const progressTimer = setInterval(() => {
            if (active.progress.resolutionActive) emitResolutionProgress(active);
        }, 30_000);
        progressTimer.unref();
        const onAbort = () => observeInterruption(active, 'request_signal_aborted');
        options.signal?.addEventListener('abort', onAbort, { once: true });
        if (options.signal?.aborted) onAbort();
        try {
            const result = await withAiInsightStage('request', callback);
            try {
                emit('info', 'ai_insight_completed', {
                    diagnosticId: active.diagnosticId,
                    stage: 'complete',
                    success: true,
                    durationMs: elapsed(started),
                });
            } catch {
                /* Logging must not change the response. */
            }
            return result;
        } finally {
            clearInterval(progressTimer);
            options.signal?.removeEventListener('abort', onAbort);
        }
    });
};
