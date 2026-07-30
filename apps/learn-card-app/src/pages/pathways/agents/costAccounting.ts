/**
 * Cost accounting — pure helpers over a flat history of invocation
 * events. No store access here; the store wraps these.
 *
 * The history is an append-only log of `{ capability, costCents, at }`.
 * Everything else (monthly spend, daily windows, per-capability
 * breakdowns) is derived.
 */

import type { Capability } from '../types';

import type { BudgetState } from './budgets';

// -----------------------------------------------------------------
// Invocation event
// -----------------------------------------------------------------

export interface InvocationEvent {
    capability: Capability;
    /** Actual cents billed (post-call, not projected). */
    costCents: number;
    /** ISO timestamp. */
    at: string;
}

// -----------------------------------------------------------------
// Rolling windows
// -----------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const monthKey = (iso: string): string => {
    // YYYY-MM — UTC so the cap rolls over the same instant for everyone.
    const d = new Date(iso);

    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const monthToDateCents = (
    history: readonly InvocationEvent[],
    now: string,
): number => {
    const key = monthKey(now);

    return history.reduce(
        (sum, e) => (monthKey(e.at) === key ? sum + e.costCents : sum),
        0,
    );
};

export const monthToDateByCapability = (
    history: readonly InvocationEvent[],
    now: string,
): Record<Capability, number> => {
    const key = monthKey(now);

    const out: Record<Capability, number> = {
        planning: 0,
        interpretation: 0,
        nudging: 0,
        routing: 0,
        matching: 0,
    };

    for (const event of history) {
        if (monthKey(event.at) !== key) continue;

        out[event.capability] += event.costCents;
    }

    return out;
};

export const dailyInvocationsFor = (
    history: readonly InvocationEvent[],
    capability: Capability,
    now: string,
): number => {
    const cutoff = new Date(now).getTime() - MS_PER_DAY;

    return history.reduce(
        (count, e) =>
            e.capability === capability && new Date(e.at).getTime() >= cutoff
                ? count + 1
                : count,
        0,
    );
};

// -----------------------------------------------------------------
// Appending / pruning
// -----------------------------------------------------------------

/**
 * Append an event and prune anything older than two months so the
 * history can't grow unbounded. The 2-month window is deliberate:
 * monthly caps look at the current month only, but we keep last month
 * on hand for debugging and end-of-month reports.
 */
export const recordInvocation = (
    history: readonly InvocationEvent[],
    event: InvocationEvent,
): InvocationEvent[] => {
    const cutoffMs = new Date(event.at).getTime() - 62 * MS_PER_DAY;

    const pruned = history.filter(e => new Date(e.at).getTime() >= cutoffMs);

    return [...pruned, event];
};

// -----------------------------------------------------------------
// Assembling a BudgetState for decideBudget
// -----------------------------------------------------------------

export interface ComputeBudgetStateInput {
    history: readonly InvocationEvent[];
    capability: Capability;
    projectedCostCents: number;
    /** Read from elsewhere (tenant-level ledger). Defaults to 0. */
    tenantMonthToDateCents?: number;
    now: string;
}

export const computeBudgetState = ({
    history,
    capability,
    projectedCostCents,
    tenantMonthToDateCents = 0,
    now,
}: ComputeBudgetStateInput): BudgetState => ({
    capability,
    projectedCostCents,
    dailyInvocations: dailyInvocationsFor(history, capability, now),
    learnerMonthToDateCents: monthToDateCents(history, now),
    tenantMonthToDateCents,
});

// -----------------------------------------------------------------
// Snapshot — the payload for `pathways.learnerCost.snapshot`
// -----------------------------------------------------------------

export interface CostSnapshot {
    learnerDid: string;
    monthToDateCents: number;
    byCapability: Record<Capability, number>;
}

export const buildCostSnapshot = (
    history: readonly InvocationEvent[],
    learnerDid: string,
    now: string,
): CostSnapshot => ({
    learnerDid,
    monthToDateCents: monthToDateCents(history, now),
    byCapability: monthToDateByCapability(history, now),
});
