import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    type OrchestratorTelemetryEvent,
    type RunWithRecoveryCallbacks,
    type UserPrompt,
} from 'learn-card-base';

import { AnalyticsEvents } from '../analytics/events';
import { useAnalytics } from '../analytics/context';

export type ExchangeSurface = 'vci' | 'vp';

interface UseResilientExchangeArgs {
    surface: ExchangeSurface;
    counterparty?: string;
}

interface UseResilientExchangeResult {
    /**
     * Whether the resilience layer is enabled for the current user.
     * Gated behind the LaunchDarkly flag `enableOid4vcResilience`.
     * Default off so rollout is gradual.
     */
    isEnabled: boolean;
    /**
     * Pass straight into `runWithRecovery` or any wrapper that takes
     * `RunWithRecoveryCallbacks`. Memoized so consumers passing this
     * into `useEffect` deps or memoizers see a stable reference.
     */
    callbacks: RunWithRecoveryCallbacks;
    /**
     * Render `<RecoveryPromptModal prompt={pendingPrompt} onResolve={resolvePrompt} />`
     * inside the page to surface user-consent dialogs.
     */
    pendingPrompt: UserPrompt | null;
    resolvePrompt: (accepted: boolean) => void;
    /**
     * Resets the run id + outcome bookkeeping so a single page can
     * drive multiple exchanges without colliding in analytics
     * (`exchange_run_id` would otherwise join attempts across runs and
     * outcome events would fire only once per mount). Call this
     * before kicking off a retry attempt on the same page.
     */
    resetRun: () => void;
}

const cryptoRandomId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const strategyAxisFromId = (id: string): 'signer' | 'transport' | 'trust' => {
    if (id.startsWith('transport-')) return 'transport';
    if (id === 'accept-untrusted') return 'trust';
    return 'signer';
};

/**
 * Hook that wires the resilience orchestrator into a React page:
 *  - Generates a stable `exchange_run_id` per run so all telemetry
 *    events from one exchange share a join key. Bump via `resetRun()`
 *    if the same page drives more than one exchange.
 *  - Maps orchestrator telemetry events to typed analytics events.
 *  - Surfaces `pendingPrompt` for the page to render via
 *    `RecoveryPromptModal`, and resolves the orchestrator's awaiting
 *    promise when the user picks an option. On unmount, any in-flight
 *    prompt is resolved as `false` so the orchestrator's pending
 *    Promise doesn't leak.
 *  - Tracks per-attempt timing for the final OUTCOME event.
 *  - Reports the LaunchDarkly feature flag so pages can fall back to
 *    the non-resilient code path when disabled.
 */
export const useResilientExchange = ({
    surface,
    counterparty,
}: UseResilientExchangeArgs): UseResilientExchangeResult => {
    const flags = useFlags();
    const isEnabled = Boolean(flags.enableOid4vcResilience);
    const { track } = useAnalytics();

    const [runId, setRunId] = useState<string>(cryptoRandomId);
    const startedAtRef = useRef<number>(Date.now());
    const outcomeReportedRef = useRef<boolean>(false);

    const [pendingPrompt, setPendingPrompt] = useState<UserPrompt | null>(null);
    const promptResolverRef = useRef<((accepted: boolean) => void) | null>(null);

    const resetRun = useCallback(() => {
        setRunId(cryptoRandomId());
        startedAtRef.current = Date.now();
        outcomeReportedRef.current = false;
    }, []);

    const resolvePrompt = useCallback((accepted: boolean) => {
        const resolver = promptResolverRef.current;
        promptResolverRef.current = null;
        setPendingPrompt(null);
        resolver?.(accepted);
    }, []);

    const handlePrompt = useCallback(
        (prompt: UserPrompt): Promise<boolean> =>
            new Promise(resolve => {
                promptResolverRef.current = resolve;
                setPendingPrompt(prompt);
            }),
        []
    );

    // Resolve any in-flight prompt as "declined" on unmount so the
    // orchestrator's awaiting `Promise<boolean>` doesn't leak (and
    // pin the wallet + offer closures behind it).
    useEffect(
        () => () => {
            const resolver = promptResolverRef.current;
            promptResolverRef.current = null;
            resolver?.(false);
        },
        []
    );

    const handleTelemetry = useCallback(
        (event: OrchestratorTelemetryEvent) => {
            if (event.type === 'attempt_succeeded') {
                void track(AnalyticsEvents.OPENID_RESILIENCE_ATTEMPT, {
                    surface,
                    exchange_run_id: runId,
                    attempt_number: event.attemptNumber,
                    strategy_id: event.strategyId,
                    strategy_axis: strategyAxisFromId(event.strategyId),
                    outcome: 'succeeded',
                    duration_ms: event.durationMs,
                    counterparty,
                });

                if (!outcomeReportedRef.current) {
                    outcomeReportedRef.current = true;
                    const isFirstAttempt = event.attemptNumber === 1;
                    void track(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME, {
                        surface,
                        exchange_run_id: runId,
                        outcome: isFirstAttempt
                            ? 'success_first_attempt'
                            : 'success_after_fallback',
                        total_attempts: event.attemptNumber,
                        signers_tried: event.attemptLog.signersTried,
                        transport_retries: event.attemptLog.transportRetries,
                        trust_gaps_accepted: event.attemptLog.trustGapsAccepted,
                        counterparty,
                        total_duration_ms: Date.now() - startedAtRef.current,
                    });
                }
                return;
            }

            if (event.type === 'attempt_failed') {
                void track(AnalyticsEvents.OPENID_RESILIENCE_ATTEMPT, {
                    surface,
                    exchange_run_id: runId,
                    attempt_number: event.attemptNumber,
                    strategy_id: event.strategyId,
                    strategy_axis: strategyAxisFromId(event.strategyId),
                    outcome: 'failed',
                    duration_ms: event.durationMs,
                    error_kind: event.errorKind,
                    counterparty,
                });
                return;
            }

            if (event.type === 'decision_made') {
                void track(AnalyticsEvents.OPENID_RESILIENCE_DECISION, {
                    surface,
                    exchange_run_id: runId,
                    attempt_number: event.attemptNumber,
                    decision: event.decision.kind,
                    next_strategy_id:
                        event.decision.kind !== 'surface_error'
                            ? event.decision.nextStrategy.id
                            : undefined,
                    next_strategy_axis:
                        event.decision.kind !== 'surface_error'
                            ? event.decision.nextStrategy.axis
                            : undefined,
                    prompt_severity:
                        event.decision.kind === 'retry_with_prompt'
                            ? event.decision.prompt.severity
                            : undefined,
                    backoff_ms:
                        event.decision.kind === 'retry_silent'
                            ? event.decision.backoffMs
                            : undefined,
                });
                return;
            }

            if (event.type === 'orchestrator_exhausted') {
                if (!outcomeReportedRef.current) {
                    outcomeReportedRef.current = true;
                    void track(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME, {
                        surface,
                        exchange_run_id: runId,
                        outcome: 'failure_exhausted',
                        total_attempts: event.attemptLog.signersTried.length,
                        signers_tried: event.attemptLog.signersTried,
                        transport_retries: event.attemptLog.transportRetries,
                        trust_gaps_accepted: event.attemptLog.trustGapsAccepted,
                        final_error_kind: event.friendly.kind,
                        counterparty,
                        total_duration_ms: Date.now() - startedAtRef.current,
                    });
                }
                return;
            }

            if (event.type === 'prompt_resolved' && !event.accepted) {
                if (!outcomeReportedRef.current) {
                    outcomeReportedRef.current = true;
                    void track(AnalyticsEvents.OPENID_RESILIENCE_OUTCOME, {
                        surface,
                        exchange_run_id: runId,
                        outcome: 'failure_user_cancelled',
                        total_attempts: event.attemptLog.signersTried.length,
                        signers_tried: event.attemptLog.signersTried,
                        transport_retries: event.attemptLog.transportRetries,
                        trust_gaps_accepted: event.attemptLog.trustGapsAccepted,
                        counterparty,
                        total_duration_ms: Date.now() - startedAtRef.current,
                    });
                }
            }
        },
        [counterparty, surface, track, runId]
    );

    const callbacks = useMemo<RunWithRecoveryCallbacks>(
        () => ({
            onPrompt: handlePrompt,
            onTelemetry: handleTelemetry,
        }),
        [handlePrompt, handleTelemetry]
    );

    return { isEnabled, callbacks, pendingPrompt, resolvePrompt, resetRun };
};
