/**
 * Agent budgets — single source of truth for invocation pricing and
 * monthly caps.
 *
 * Docs § 7.3:
 *
 * > "Per‑invocation budgets prevent runaway single calls; per‑learner
 * >  monthly caps prevent a single user from consuming a tenant's
 * >  entire budget; per‑tenant caps surface as alerts + progressively
 * >  stricter rate limits before the bill becomes a surprise."
 *
 * Numbers here are placeholders pending product/finance sign-off. The
 * *shape* (per-invocation + per-learner + per-tenant, all in one file)
 * is the architectural commitment.
 *
 * Enforced on both sides of the proxy: the client uses these values to
 * refuse a call before it leaves the device; the brain-service uses the
 * same values to refuse a call that slipped past the client. Both sides
 * import the same module so they can never drift.
 */

import type { Capability } from '../types';

// -----------------------------------------------------------------
// Per-invocation budgets
// -----------------------------------------------------------------

export interface CapabilityBudget {
    /**
     * Ceiling for a single invocation in cents (USD). If a single call
     * would exceed this, the client refuses to send it. `maxTokensOut`
     * and the upstream model choice keep actual spend below the ceiling.
     */
    readonly perInvocationCents: number;

    /**
     * Ceiling on how often this capability may be invoked in a 24h
     * window (per learner). Relevant for always-on capabilities like
     * Matching so a tight loop can't bleed the budget.
     */
    readonly maxDailyInvocations: number;
}

export const CAPABILITY_BUDGETS = {
    planning: { perInvocationCents: 10, maxDailyInvocations: 20 },
    interpretation: { perInvocationCents: 2, maxDailyInvocations: 50 },
    nudging: { perInvocationCents: 1, maxDailyInvocations: 30 },
    routing: { perInvocationCents: 8, maxDailyInvocations: 10 },
    matching: { perInvocationCents: 6, maxDailyInvocations: 4 },
} as const satisfies Record<Capability, CapabilityBudget>;

// -----------------------------------------------------------------
// Rolling caps
// -----------------------------------------------------------------

/**
 * Hard cap per learner per calendar month, in cents. A single learner's
 * spend is a bounded number; nothing above this reaches the provider.
 */
export const LEARNER_MONTHLY_CAP_CENTS = 200;

/**
 * Soft cap per tenant per calendar month, in cents. Hitting this surfaces
 * alerts and progressively stricter rate limits before the bill becomes
 * a surprise.
 */
export const TENANT_MONTHLY_CAP_CENTS = 50_000;

// -----------------------------------------------------------------
// Decision helpers — pure, so they can be unit-tested end-to-end
// -----------------------------------------------------------------

export type BudgetDecision =
    | { allowed: true }
    | {
          allowed: false;
          cappedAt: 'per-invocation' | 'per-learner-daily' | 'per-learner-monthly' | 'per-tenant-monthly';
          reason: string;
      };

export interface BudgetState {
    capability: Capability;
    /** Cents that *would* be charged for this specific invocation. */
    projectedCostCents: number;
    /** Invocations this capability has made in the last 24h for this learner. */
    dailyInvocations: number;
    /** Cumulative spend in the current calendar month, per learner. */
    learnerMonthToDateCents: number;
    /** Cumulative spend in the current calendar month, per tenant. */
    tenantMonthToDateCents: number;
}

/**
 * Should this invocation be permitted? Checks the four budget surfaces
 * in order of cheapest-to-evaluate first.
 */
export const decideBudget = (state: BudgetState): BudgetDecision => {
    const budget = CAPABILITY_BUDGETS[state.capability];

    if (state.projectedCostCents > budget.perInvocationCents) {
        return {
            allowed: false,
            cappedAt: 'per-invocation',
            reason: `Estimated cost ${state.projectedCostCents}¢ exceeds per-invocation ceiling ${budget.perInvocationCents}¢ for ${state.capability}`,
        };
    }

    if (state.dailyInvocations >= budget.maxDailyInvocations) {
        return {
            allowed: false,
            cappedAt: 'per-learner-daily',
            reason: `${state.capability} already hit its daily limit of ${budget.maxDailyInvocations} invocations`,
        };
    }

    if (
        state.learnerMonthToDateCents + state.projectedCostCents >
        LEARNER_MONTHLY_CAP_CENTS
    ) {
        return {
            allowed: false,
            cappedAt: 'per-learner-monthly',
            reason: 'Learner monthly spend cap reached',
        };
    }

    if (
        state.tenantMonthToDateCents + state.projectedCostCents >
        TENANT_MONTHLY_CAP_CENTS
    ) {
        return {
            allowed: false,
            cappedAt: 'per-tenant-monthly',
            reason: 'Tenant monthly spend cap reached',
        };
    }

    return { allowed: true };
};
