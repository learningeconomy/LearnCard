import {
    EscrowPinMismatchError,
    EscrowPinThrottledError,
    EscrowRequestError,
} from '@learncard/sss-key-manager';

const reasons = new Set([
    'policy',
    'pin_mismatch',
    'blob',
    'unavailable',
    'ledger',
    'time',
    'transport',
    'malformed',
    'invalid_response',
    'invalid_hold',
    'http_refusal',
    'rate_limit',
    'codeMismatch',
    'codeExpired',
    'codeLocked',
    'nonce',
    'pcr',
    'root',
    'chain',
    'signature',
    'freshness',
    'config',
    'verify',
    'secret_read',
    'stale_event',
    'auth',
    // Tier 3 (allowlisted, non-sensitive)
    'email_untrusted',
    'email_missing',
    'early_release',
    'start_lost',
    'release_interrupted',
    'cleanup_failed',
    'cancel_not_refused',
    'did_mismatch',
    'not_enrolled',
    'deadline_mismatch',
    'warning_missing',
    'code_not_sent',
    'existing_hold',
    'interrupted',
    'evidence',
]);
export const safeReason = (error: unknown): string => {
    if (error instanceof EscrowPinMismatchError) return 'pin_mismatch';
    if (error instanceof EscrowPinThrottledError) return 'rate_limit';
    if (error instanceof EscrowRequestError && error.status === 429) return 'rate_limit';
    if (
        error &&
        typeof error === 'object' &&
        'reason' in error &&
        typeof error.reason === 'string' &&
        reasons.has(error.reason)
    )
        return error.reason;
    return 'unexpected';
};
export type Step =
    | 'config'
    | 'stale_event'
    | 'secret'
    | 'auth'
    | 'attestation'
    | 'authority'
    | 'identity'
    | 'crashRepair'
    | 'wrongPin'
    | 'recovery'
    | 'persist'
    | 'resetPin'
    | 'ledger'
    | 'start'
    | 'codeEmail'
    | 'confirm'
    | 'status'
    | 'warning'
    | 'earlyRelease'
    | 'release'
    | 'reenrol'
    | 'cancel'
    | 'cleanup';
export type Tier3Metric =
    | 'Tier3.Started'
    | 'Tier3.Confirmed'
    | 'Tier3.Warned'
    | 'Tier3.Released'
    | 'Tier3.Reenrolled'
    | 'Tier3.Cancelled'
    | 'Tier3.EmailLatency'
    | 'Tier3.Overdue'
    | 'Tier3.PoolAvailable'
    | 'Tier3.StartAgeMinutes'
    | 'Tier3.Paused'
    | 'Tier3.EvaluatorHeartbeat';
export type Metric =
    | 'Tier1.Success'
    | 'Tier2.Success'
    | 'Runner.AuthFailure'
    | 'Step.Latency'
    | 'Step.Failure'
    | Tier3Metric;
/** Positional tier-3 pool labels; never configured account identifiers. */
export type HoldLabel = `hold-${string}`;
export interface MetricContext {
    /** Tier 2 only: part of the alarm series. */
    account?: 'pin-a' | 'pin-b';
    /** Tier 3 only: a diagnostic dimension, never part of an alarm series. */
    holdAccount?: HoldLabel;
    /** Tier 3 run/email kind: diagnostic, except the EmailLatency Kind rollup. */
    kind?: 'daily' | 'cancel' | 'code' | 'warning';
    outcome?: 'duplicate';
    timestamp?: number;
}
export type Emit = (
    name: Metric,
    value: number,
    step?: Step,
    error?: unknown,
    context?: MetricContext
) => void;

/** Fixed positional labels, never secret/configured account identifiers. */
export const accountForEvent = (tier: 1 | 2, time: number): MetricContext['account'] =>
    tier === 1 ? undefined : Math.floor(time / 1_800_000) % 2 === 0 ? 'pin-a' : 'pin-b';

/** A projection/scrubbing logger: arbitrary messages, objects, IDs and stacks NEVER reach output. */
export const createMetrics =
    (
        environment: 'staging' | 'production',
        tier: 1 | 2 | 3,
        sink: (line: string) => void = console.log
    ): Emit =>
    (name, value, step, error, context) => {
        const base = { Environment: environment, Tier: String(tier) };
        const alarm = { ...base, ...(context?.account ? { Account: context.account } : {}) };
        const dimensions = {
            ...alarm,
            ...(context?.holdAccount ? { Account: context.holdAccount } : {}),
            ...(context?.kind ? { Kind: context.kind } : {}),
            ...(step ? { Step: step } : {}),
            ...(error !== undefined ? { Reason: safeReason(error) } : {}),
            ...(context?.outcome ? { Outcome: context.outcome } : {}),
        };
        // Explicit rollups keep diagnostic dimensions from splitting alarm series.
        const sets = [Object.keys(dimensions)];
        if (name.endsWith('.Success') || name === 'Runner.AuthFailure') {
            sets.push(Object.keys(alarm), Object.keys(base));
        }
        // Tier 3 alarms use {Environment, Tier} only; EmailLatency also by Kind.
        if (name.startsWith('Tier3.')) {
            if (name === 'Tier3.EmailLatency' && context?.kind)
                sets.push([...Object.keys(base), 'Kind']);
            sets.push(Object.keys(base));
        }
        // Constructor name only (never the message): a non-dimension log property.
        const cause =
            error &&
            typeof error === 'object' &&
            'causeName' in error &&
            typeof error.causeName === 'string'
                ? { Cause: error.causeName.replace(/[^A-Za-z0-9_]/g, '').slice(0, 64) }
                : {};
        sink(
            JSON.stringify({
                ...cause,
                _aws: {
                    Timestamp: context?.timestamp ?? Date.now(),
                    CloudWatchMetrics: [
                        {
                            Namespace: 'LearnCard/EscrowCanary',
                            Dimensions: sets.filter(
                                (keys, index) =>
                                    sets.findIndex(other => other.join() === keys.join()) === index
                            ),
                            Metrics: [
                                {
                                    Name: name,
                                    Unit:
                                        name === 'Step.Latency' || name === 'Tier3.EmailLatency'
                                            ? 'Milliseconds'
                                            : 'Count',
                                },
                            ],
                        },
                    ],
                },
                ...dimensions,
                [name]: value,
            })
        );
    };
