import { AsyncLocalStorage } from 'node:async_hooks';

type RequestCounts = { requests: number; measuredRequests: number };
export type UsageMeter = {
    generation: RequestCounts & { inputTokens: number; outputTokens: number };
    embedding: RequestCounts & { inputTokens: number };
    privacy: RequestCounts & { textUnits: number; freeTextUnits: number };
};
export type UsageKind = keyof UsageMeter;

const scope = new AsyncLocalStorage<UsageMeter>();
const budgetScope = new AsyncLocalStorage<(kind: UsageKind) => Promise<void>>();
// A malformed provider count must not poison a job's numeric aggregates.
const MAX_REQUEST_USAGE = 1_000_000_000;

export const createUsageMeter = (): UsageMeter => ({
    generation: {
        requests: 0,
        measuredRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
    },
    embedding: { requests: 0, measuredRequests: 0, inputTokens: 0 },
    privacy: { requests: 0, measuredRequests: 0, textUnits: 0, freeTextUnits: 0 },
});

export const withUsageMeter = <Result>(meter: UsageMeter, operation: () => Result): Result =>
    scope.run(meter, operation);

/** Opt-in dispatch authorization, independent of usage telemetry. */
export const withProviderBudget = <Result>(
    reserve: (kind: UsageKind) => Promise<void>,
    operation: () => Result
): Result => budgetScope.run(reserve, operation);

/** Await immediately before dispatch; a rejected reservation must fail closed. */
export async function reserveProviderRequest(kind: UsageKind): Promise<void> {
    await budgetScope.getStore()?.(kind);
}

// Read only own data properties. Never execute provider accessors.
// Telemetry cannot retain payloads or replace provider results/failures.
export function usageField(
    value: unknown,
    key:
        | 'usage'
        | 'input_tokens'
        | 'output_tokens'
        | 'sensitiveInformationPolicyUnits'
        | 'sensitiveInformationPolicyFreeUnits'
        | 'inputTokens'
        | 'outputTokens'
        | 'textUnits'
        | 'freeTextUnits'
): unknown {
    try {
        return value !== null && typeof value === 'object'
            ? Object.getOwnPropertyDescriptor(value, key)?.value
            : undefined;
    } catch {
        return undefined;
    }
}

const count = (value: unknown): value is number =>
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= MAX_REQUEST_USAGE;

/**
 * Call immediately before a provider dispatch. The returned callback accepts
 * only normalized usage counts, once. Totals cover measured requests only:
 * requests > measuredRequests means unknown usage, never zero billed usage.
 */
export function recordUsageRequest(kind: UsageKind): (usage: unknown) => void {
    const meter = scope.getStore();
    if (!meter) return () => {};
    const bucket = meter[kind];
    bucket.requests += 1;
    let recorded = false;
    return usage => {
        if (recorded) return;
        recorded = true;
        if (kind === 'generation') {
            const input = usageField(usage, 'inputTokens');
            const output = usageField(usage, 'outputTokens');
            if (
                !count(input) ||
                !count(output) ||
                !Number.isSafeInteger(meter.generation.inputTokens + input) ||
                !Number.isSafeInteger(meter.generation.outputTokens + output)
            )
                return;
            meter.generation.inputTokens += input;
            meter.generation.outputTokens += output;
        } else if (kind === 'embedding') {
            const input = usageField(usage, 'inputTokens');
            if (!count(input) || !Number.isSafeInteger(meter.embedding.inputTokens + input)) return;
            meter.embedding.inputTokens += input;
        } else {
            const units = usageField(usage, 'textUnits');
            const freeUnits = usageField(usage, 'freeTextUnits');
            if (
                !count(units) ||
                !count(freeUnits) ||
                !Number.isSafeInteger(meter.privacy.textUnits + units) ||
                !Number.isSafeInteger(meter.privacy.freeTextUnits + freeUnits)
            )
                return;
            meter.privacy.textUnits += units;
            meter.privacy.freeTextUnits += freeUnits;
        }
        bucket.measuredRequests += 1;
    };
}
