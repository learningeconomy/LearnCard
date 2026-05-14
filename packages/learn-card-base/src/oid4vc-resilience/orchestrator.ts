import { getFriendlyOpenID4VCError } from '../helpers/openid4vcErrors';
import { decideRecovery } from './decideRecovery';
import {
    createEmptyAttemptLog,
    type AttemptLog,
    type NextStrategy,
    type Runner,
    type RunWithRecoveryCallbacks,
    type RunWithRecoveryConfig,
} from './types';

const sleep = (ms: number): Promise<void> =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
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
            attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
        });

        const startTime = Date.now();
        try {
            const result = await runner({ strategy, attemptLog: { ...attemptLog } });
            callbacks.onTelemetry?.({
                type: 'attempt_succeeded',
                strategyId: strategy.id,
                attemptNumber,
                durationMs: Date.now() - startTime,
                attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
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
                attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
            });

            const decision = decideRecovery({
                friendly,
                raw,
                attempted: attemptLog,
                availableSigners: config.availableSigners,
            });

            callbacks.onTelemetry?.({
                type: 'decision_made',
                decision,
                attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
            });

            if (decision.kind === 'surface_error') {
                callbacks.onTelemetry?.({
                    type: 'orchestrator_exhausted',
                    friendly,
                    attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
                });
                throw raw;
            }

            if (decision.kind === 'retry_with_prompt') {
                callbacks.onTelemetry?.({
                    type: 'prompt_shown',
                    prompt: decision.prompt,
                    attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
                });
                const userOk = (await callbacks.onPrompt?.(decision.prompt)) ?? false;
                callbacks.onTelemetry?.({
                    type: 'prompt_resolved',
                    accepted: userOk,
                    attemptLog: { ...attemptLog, signersTried: [...attemptLog.signersTried] },
                });
                if (!userOk) {
                    callbacks.onTelemetry?.({
                        type: 'orchestrator_exhausted',
                        friendly,
                        attemptLog: {
                            ...attemptLog,
                            signersTried: [...attemptLog.signersTried],
                        },
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
