import { getFriendlyOpenID4VCError, type ExchangeErrorKind } from '../helpers/openid4vcErrors';
import { decideRecovery, extractErrorMessage, isSignerResolutionFailure } from './decideRecovery';
import { extractErrorFields, hashMessage } from './errorFields';
import {
    createEmptyAttemptLog,
    type AttemptLog,
    type NextStrategy,
    type Runner,
    type RunWithRecoveryCallbacks,
    type RunWithRecoveryConfig,
} from './types';

/**
 * Friendly kinds that MIGHT have been recoverable but weren't — when
 * the orchestrator surfaces an error of one of these kinds, we emit
 * `unrecognized_recoverable_failure` so production telemetry can be
 * mined for new structured-dispatch / pattern entries.
 *
 * Excludes `transport` (already has its own retry policy), `format_gap`
 * (terminal by definition), and `trust_gap` (user-driven outcome, not
 * a pattern miss).
 */
const POTENTIALLY_RECOVERABLE_KINDS: ReadonlySet<ExchangeErrorKind> = new Set([
    'wallet',
    'request_invalid',
    'unknown',
]);

const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const snapshotLog = (log: AttemptLog): AttemptLog => ({
    signersTried: [...log.signersTried],
    transportRetries: log.transportRetries,
    trustGapsAccepted: log.trustGapsAccepted,
});

/**
 * Drive `runner` with strategy fallback and classified-error retry.
 *
 * The loop is deterministic: each iteration runs `runner`, classifies
 * any thrown error via `getFriendlyOpenID4VCError`, asks
 * `decideRecovery` for the next action, and either retries silently,
 * prompts the user, or surfaces the original error. The original
 * (raw) error is re-thrown when the orchestrator gives up — callers
 * downstream still see the same exception they would have without
 * the wrapper, so existing error UIs keep working.
 */
export const runWithRecovery = async <R>(
    runner: Runner<R>,
    config: RunWithRecoveryConfig,
    callbacks: RunWithRecoveryCallbacks = {}
): Promise<R> => {
    if (config.availableSigners.length === 0) {
        throw new Error('runWithRecovery: availableSigners must be non-empty');
    }

    const attemptLog: AttemptLog = createEmptyAttemptLog();
    let strategy: NextStrategy =
        config.initialStrategy ?? { axis: 'signer', id: config.availableSigners[0] };
    let attemptNumber = 0;
    let previousFriendly: ReturnType<typeof getFriendlyOpenID4VCError> | undefined;

    while (true) {
        attemptNumber += 1;

        if (strategy.axis === 'signer' && !attemptLog.signersTried.includes(strategy.id)) {
            attemptLog.signersTried.push(strategy.id);
        }

        callbacks.onAttempt?.({
            strategyId: strategy.id,
            attemptNumber,
            previousError: previousFriendly,
        });
        callbacks.onTelemetry?.({
            type: 'attempt_started',
            strategyId: strategy.id,
            attemptNumber,
            attemptLog: snapshotLog(attemptLog),
        });

        const startTime = Date.now();
        try {
            const result = await runner({ strategy, attemptLog: snapshotLog(attemptLog) });
            callbacks.onTelemetry?.({
                type: 'attempt_succeeded',
                strategyId: strategy.id,
                attemptNumber,
                durationMs: Date.now() - startTime,
                attemptLog: snapshotLog(attemptLog),
            });
            return result;
        } catch (raw) {
            const friendly = getFriendlyOpenID4VCError(raw);
            previousFriendly = friendly;

            callbacks.onTelemetry?.({
                type: 'attempt_failed',
                strategyId: strategy.id,
                attemptNumber,
                durationMs: Date.now() - startTime,
                friendly,
                errorKind: friendly.kind,
                attemptLog: snapshotLog(attemptLog),
            });

            const decision = decideRecovery({
                friendly,
                raw,
                attempted: snapshotLog(attemptLog),
                availableSigners: config.availableSigners,
            });

            callbacks.onTelemetry?.({
                type: 'decision_made',
                attemptNumber,
                decision,
                attemptLog: snapshotLog(attemptLog),
            });

            if (decision.kind === 'surface_error') {
                callbacks.onTelemetry?.({
                    type: 'orchestrator_exhausted',
                    friendly,
                    attemptLog: snapshotLog(attemptLog),
                });

                if (POTENTIALLY_RECOVERABLE_KINDS.has(friendly.kind)) {
                    const fields = extractErrorFields(raw);
                    callbacks.onTelemetry?.({
                        type: 'unrecognized_recoverable_failure',
                        attemptNumber,
                        messageHash: hashMessage(extractErrorMessage(raw)),
                        errorName: fields.name,
                        errorCode: fields.code,
                        httpStatus: fields.status,
                        friendly,
                        patternMatched: isSignerResolutionFailure(friendly, raw),
                        attemptLog: snapshotLog(attemptLog),
                    });
                }

                throw raw;
            }

            if (decision.kind === 'retry_with_prompt') {
                callbacks.onTelemetry?.({
                    type: 'prompt_shown',
                    prompt: decision.prompt,
                    attemptLog: snapshotLog(attemptLog),
                });
                const userOk = (await callbacks.onPrompt?.(decision.prompt)) ?? false;
                callbacks.onTelemetry?.({
                    type: 'prompt_resolved',
                    accepted: userOk,
                    attemptLog: snapshotLog(attemptLog),
                });
                if (!userOk) {
                    callbacks.onTelemetry?.({
                        type: 'orchestrator_exhausted',
                        friendly,
                        attemptLog: snapshotLog(attemptLog),
                    });
                    throw raw;
                }
            }

            if (decision.nextStrategy.axis === 'transport') {
                attemptLog.transportRetries += 1;
                if (decision.kind === 'retry_silent' && decision.backoffMs) {
                    await sleep(decision.backoffMs);
                }
            } else if (decision.nextStrategy.axis === 'trust') {
                attemptLog.trustGapsAccepted += 1;
            }

            strategy = decision.nextStrategy;
        }
    }
};
