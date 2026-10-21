import type { MaintenanceBudget } from '../share-link-coordinator';

/**
 * Monotonic wall-clock budget for one maintenance pass.
 *
 * The runner checks `exhausted()` before each claim; once the remaining time is
 * at or below `finalizeReserveMs` it must stop starting new graph/remote work so
 * the pass can still log and return a summary. This is a cooperative deadline,
 * not a hard kill: it never uses `Promise.race`, which would leave an untracked
 * mutation running after the pass returned.
 */
export type MaintenancePassBudget = MaintenanceBudget & {
    elapsedMs: () => number;
    configuredMs: number;
};

const defaultMonotonicNow = (): number =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();

/**
 * Resolve the pass budget from a Lambda remaining-time value.
 *
 * `undefined` means "no Lambda signal" and keeps the configured budget. Any
 * other value failing the finite/positive check — NaN, Infinity, negative or
 * zero — fails closed to a zero budget so the pass does no work.
 */
export const resolveMaintenanceBudgetMs = (
    configuredBudgetMs: number,
    remainingTimeMs: number | undefined
): number => {
    if (remainingTimeMs === undefined) return configuredBudgetMs;
    if (!Number.isFinite(remainingTimeMs) || remainingTimeMs <= 0) return 0;

    return Math.min(configuredBudgetMs, Math.trunc(remainingTimeMs));
};

export const createMaintenancePassBudget = (input: {
    budgetMs: number;
    finalizeReserveMs: number;
    monotonicNow?: () => number;
}): MaintenancePassBudget => {
    const monotonicNow = input.monotonicNow ?? defaultMonotonicNow;
    const configuredMs = Number.isFinite(input.budgetMs)
        ? Math.max(0, Math.trunc(input.budgetMs))
        : 0;
    const reserveMs = Number.isFinite(input.finalizeReserveMs)
        ? Math.max(0, Math.trunc(input.finalizeReserveMs))
        : 0;
    const startedAt = monotonicNow();
    const deadline = startedAt + configuredMs;

    const remainingMs = (): number => deadline - monotonicNow();

    return {
        configuredMs,
        elapsedMs: () => monotonicNow() - startedAt,
        remainingMs,
        reserveMs: () => reserveMs,
        exhausted: () => remainingMs() <= reserveMs,
    };
};
