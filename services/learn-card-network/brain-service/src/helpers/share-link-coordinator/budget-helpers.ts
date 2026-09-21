import type { MaintenanceBudget } from './types';

/**
 * True only for the maintenance budget that opted into whole-unit admission.
 * Legacy/direct callers that pass a bare budget keep the reviewed `exhausted`
 * gate and are never subjected to the extra mid-unit rechecks.
 */
export const budgetHasUnitReserve = (budget: MaintenanceBudget | undefined): boolean =>
    budget !== undefined && typeof budget.reserveMs === 'function';

/**
 * Cooperative budget helpers shared by the recovery and cleanup runners.
 *
 * `budgetAllows` is deliberately conservative only when the caller opted into the
 * maintenance reserve (`reserveMs`). Direct/legacy callers that pass a bare budget
 * keep the reviewed `exhausted()` behaviour, so this cannot silently disable a
 * one-shot runner that predates the maintenance scheduler.
 */
export const budgetAllows = (budget: MaintenanceBudget | undefined, costMs: number): boolean => {
    if (!budget) return true;

    if (typeof budget.reserveMs !== 'function' || !Number.isFinite(costMs)) {
        return !budget.exhausted();
    }

    const remaining = budget.remainingMs();
    if (!Number.isFinite(remaining)) return false;

    return remaining - budget.reserveMs() >= Math.max(0, costMs);
};

/**
 * Bound a per-call managed-transaction timeout by the time actually left before
 * the pass reserve. The result is always >= 1 so an explicit maintenance
 * transaction still has a positive server-side bound; it can never extend the
 * configured timeout.
 */
export const boundTransactionTimeout = (
    configuredTimeoutMs: number | undefined,
    budget: MaintenanceBudget | undefined
): number | undefined => {
    if (configuredTimeoutMs === undefined) return undefined;
    if (!budget) return configuredTimeoutMs;

    const remaining = budget.remainingMs();
    if (!Number.isFinite(remaining)) return configuredTimeoutMs;

    const reserved = typeof budget.reserveMs === 'function' ? budget.reserveMs() : 0;
    const available = remaining - reserved;
    if (!Number.isFinite(available)) return configuredTimeoutMs;

    return Math.max(1, Math.trunc(Math.min(configuredTimeoutMs, available)));
};
