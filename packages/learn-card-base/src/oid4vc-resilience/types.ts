import type { ExchangeErrorKind, FriendlyErrorInfo } from '../helpers/openid4vcErrors';

/**
 * Cumulative log of strategies attempted during a single resilient
 * exchange run. The orchestrator passes a snapshot of this into both
 * the recovery decision function and telemetry events so consumers
 * can reason about "where are we in the fallback chain".
 */
export interface AttemptLog {
    /** Stable signer-strategy ids already attempted, in order. */
    signersTried: string[];
    /** Number of transport-retry decisions taken. */
    transportRetries: number;
    /** Number of user-confirmed trust-gap bypasses. */
    trustGapsAccepted: number;
}

export const createEmptyAttemptLog = (): AttemptLog => ({
    signersTried: [],
    transportRetries: 0,
    trustGapsAccepted: 0,
});

export type StrategyAxis = 'signer' | 'transport' | 'trust';

/**
 * The next strategy the orchestrator will try after an error.
 * `axis` selects the bookkeeping / runner branch; `id` is a stable
 * telemetry-friendly identifier (e.g. `did:key`, `transport-retry-2`,
 * `accept-untrusted`).
 */
export interface NextStrategy {
    axis: StrategyAxis;
    id: string;
}

/**
 * No-jargon user-facing prompt shown when the orchestrator needs
 * consent before trying a fallback strategy. Severity drives styling
 * (`info` = teal, `warning` = amber).
 */
export interface UserPrompt {
    title: string;
    body: string;
    cta: string;
    cancelCta?: string;
    severity: 'info' | 'warning';
}

export type RecoveryDecision =
    | { kind: 'retry_silent'; nextStrategy: NextStrategy; backoffMs?: number }
    | { kind: 'retry_with_prompt'; nextStrategy: NextStrategy; prompt: UserPrompt }
    | { kind: 'surface_error'; friendly: FriendlyErrorInfo };

/**
 * Telemetry events emitted by the orchestrator. Consumers map these
 * to their analytics / Sentry / log sinks. Every event carries an
 * `attemptLog` snapshot so receivers can reconstruct the fallback
 * chain.
 *
 * Event ordering inside one iteration of the retry loop:
 *  1. `attempt_started`
 *  2. either `attempt_succeeded` (loop exits) OR `attempt_failed`
 *  3. `decision_made` (only after `attempt_failed`) — carries the
 *     decision that WILL be applied, including the upcoming prompt
 *     for `retry_with_prompt`. Consumers wiring side effects to a
 *     decision should NOT use this event to render the prompt — that
 *     happens via `prompt_shown` next, and the user response via
 *     `prompt_resolved`. Treat `decision_made` as the intent log,
 *     not the user-facing trigger.
 *  4. `prompt_shown` + `prompt_resolved` (only for `retry_with_prompt`)
 *  5. `orchestrator_exhausted` if the decision was `surface_error` or
 *     if the prompt was declined.
 *
 * `attemptNumber` is included on every event that maps to a specific
 * iteration (started/succeeded/failed/decision_made), letting
 * receivers join `decision_made` to `attempt_failed` by
 * (`exchange_run_id`, `attemptNumber`) without inferring from
 * `attemptLog.signersTried.length` (which is wrong for transport
 * retries — they don't grow `signersTried`).
 */
export type OrchestratorTelemetryEvent =
    | {
          type: 'attempt_started';
          strategyId: string;
          attemptNumber: number;
          attemptLog: AttemptLog;
      }
    | {
          type: 'attempt_succeeded';
          strategyId: string;
          attemptNumber: number;
          durationMs: number;
          attemptLog: AttemptLog;
      }
    | {
          type: 'attempt_failed';
          strategyId: string;
          attemptNumber: number;
          durationMs: number;
          friendly: FriendlyErrorInfo;
          errorKind: ExchangeErrorKind;
          attemptLog: AttemptLog;
      }
    | {
          type: 'decision_made';
          attemptNumber: number;
          decision: RecoveryDecision;
          attemptLog: AttemptLog;
      }
    | {
          type: 'prompt_shown';
          prompt: UserPrompt;
          attemptLog: AttemptLog;
      }
    | {
          type: 'prompt_resolved';
          accepted: boolean;
          attemptLog: AttemptLog;
      }
    | {
          type: 'orchestrator_exhausted';
          friendly: FriendlyErrorInfo;
          attemptLog: AttemptLog;
      };

export interface RunWithRecoveryCallbacks {
    /**
     * Called at the start of each attempt — useful for spinner copy
     * (`"Connecting…"` on attempt 1, `"Trying another way…"` on
     * attempt 2, etc.). Optional.
     */
    onAttempt?: (info: {
        strategyId: string;
        attemptNumber: number;
        previousError?: FriendlyErrorInfo;
    }) => void;
    /**
     * Called when the orchestrator needs user consent before applying
     * a fallback strategy. Resolve `true` to proceed, `false` to give
     * up. If omitted, prompt decisions default to `false` (give up).
     */
    onPrompt?: (prompt: UserPrompt) => Promise<boolean>;
    /** Wired to analytics / observability sinks. */
    onTelemetry?: (event: OrchestratorTelemetryEvent) => void;
}

/**
 * The runner is the unit of work the orchestrator retries — typically
 * a wrapped call to `wallet.invoke.acceptCredentialOffer` or
 * `wallet.invoke.presentCredentials`. The orchestrator hands it the
 * current strategy and a snapshot of the attempt log so the runner
 * can branch on (e.g.) which signer to construct.
 */
export interface AttemptArgs {
    strategy: NextStrategy;
    attemptLog: AttemptLog;
}

export type Runner<R> = (args: AttemptArgs) => Promise<R>;

export interface RunWithRecoveryConfig {
    /**
     * Stable signer-strategy ids the runner knows how to apply, in
     * preferred order. The first id is used for the initial attempt
     * unless `initialStrategy` overrides it.
     */
    availableSigners: string[];
    initialStrategy?: NextStrategy;
}
