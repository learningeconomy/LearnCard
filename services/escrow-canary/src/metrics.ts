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
    | 'secret'
    | 'auth'
    | 'attestation'
    | 'authority'
    | 'identity'
    | 'crashRepair'
    | 'wrongPin'
    | 'recovery'
    | 'persist'
    | 'resetPin';
export type Metric =
    'Tier1.Success' | 'Tier2.Success' | 'Runner.AuthFailure' | 'Step.Latency' | 'Step.Failure';
export type Emit = (name: Metric, value: number, step?: Step, error?: unknown) => void;

/** A projection/scrubbing logger: arbitrary messages, objects, IDs and stacks NEVER reach output. */
export const createMetrics =
    (
        environment: 'staging' | 'production',
        tier: 1 | 2,
        sink: (line: string) => void = console.log
    ): Emit =>
    (name, value, step, error) => {
        const dimensions = {
            Environment: environment,
            Tier: String(tier),
            ...(step ? { Step: step } : {}),
            ...(error !== undefined ? { Reason: safeReason(error) } : {}),
        };
        sink(
            JSON.stringify({
                _aws: {
                    Timestamp: Date.now(),
                    CloudWatchMetrics: [
                        {
                            Namespace: 'LearnCard/EscrowCanary',
                            Dimensions: [Object.keys(dimensions)],
                            Metrics: [
                                {
                                    Name: name,
                                    Unit: name === 'Step.Latency' ? 'Milliseconds' : 'Count',
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
