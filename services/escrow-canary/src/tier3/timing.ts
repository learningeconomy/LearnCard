/**
 * Pure tier-3 timing rules. The runner never computes "day 7" itself: the
 * effective deadline is lca-api's `releaseAfter`, read after the warning.
 */
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;
/** lca-api `ESCROW_RELEASE_TIME_MARGIN_MS` (models/EscrowHold.ts). */
export const RELEASE_MARGIN_MS = MINUTE;
/** Allowed clock disagreement between the runner, lca-api and the enclave. */
export const SKEW_MS = 2 * MINUTE;
/** Enclave one-time-code lifetime (policy/authority.rs). Never confirm after it. */
export const CODE_TTL_MS = 30 * MINUTE;
/** Warning-email body says "about {hours} hours"; today always 24. */
export const WARNING_HOURS = 24;
/** Re-read status until the recomputed deadline appears, at most this long. */
export const WARNING_DEADLINE_GRACE_MS = 2 * HOUR;

/**
 * lca-api's hourly job sends the warning once at most {@link WARNING_HOURS} of the
 * hold remain, so measured from confirmation it is due after `hold - 24h`, and at
 * once for holds of 24h or less (staging uses a 10-minute hold).
 */
export const warningSendsAfterMs = (holdDurationMs: number): number =>
    Math.max(0, holdDurationMs - WARNING_HOURS * HOUR);

/** Warning step deadline from confirmation: the hourly job may run up to an hour late. */
export const warningDeadlineMs = (holdDurationMs: number): number =>
    warningSendsAfterMs(holdDurationMs) + 2 * HOUR;

export const STEP_DEADLINES = {
    CodeEmail: 5 * MINUTE,
    Confirmed: 10 * MINUTE,
    /** From the effective deadline (`releaseAfter`). */
    Released: 2 * HOUR,
    Cancelled: 10 * MINUTE,
} as const;

/**
 * A daily run whose warning never arrived is closed (orphaned) this long after
 * the Warning step's due time, so the evaluator's Overdue page always fires first.
 */
export const WARNING_MISSING_GRACE_MS = DAY;

/** Closed runs/steps expire from the ledger after this (DynamoDB TTL, seconds). */
export const CLOSED_TTL_MS = 35 * DAY;
export const ttlSeconds = (now: number): number => Math.floor((now + CLOSED_TTL_MS) / 1000);
/**
 * Run headers expire a day after their steps. DynamoDB TTL deletes in no
 * guaranteed order; this keeps headers outliving their steps in practice (the
 * evaluator also tolerates a closed step without its header).
 */
export const runTtlSeconds = (now: number): number => ttlSeconds(now + DAY);

export const dayKey = (now: number): string => new Date(now).toISOString().slice(0, 10);

/** ISO-8601 week key, e.g. 2026-W44. */
export const isoWeekKey = (now: number): string => {
    const date = new Date(now);
    const day = (date.getUTCDay() + 6) % 7; // Monday = 0
    const thursday = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() - day + 3
    );
    const year = new Date(thursday).getUTCFullYear();
    const week = 1 + Math.floor((thursday - Date.UTC(year, 0, 1)) / (7 * DAY));
    return `${year}-W${String(week).padStart(2, '0')}`;
};

export const isDailyStartDue = (now: number, startHourUtc: number): boolean =>
    new Date(now).getUTCHours() >= startHourUtc;

/** Weekly cancel run: Mondays, from one hour after the daily start hour. */
export const isCancelDue = (now: number, startHourUtc: number): boolean => {
    const date = new Date(now);
    return date.getUTCDay() === 1 && date.getUTCHours() >= startHourUtc + 1;
};

/**
 * At confirmation, lca-api has not exposed `confirmedHi`, so only a window can
 * be checked: the deadline must lie between "confirm call started + hold" and
 * "confirm returned + hold", widened by the release margin and clock skew.
 */
export const confirmWindowOk = (input: {
    releaseAfter: number;
    confirmCallStartedAt: number;
    confirmedAt: number;
    holdDurationMs: number;
}): boolean =>
    input.releaseAfter >=
        input.confirmCallStartedAt + input.holdDurationMs + RELEASE_MARGIN_MS - SKEW_MS &&
    input.releaseAfter <= input.confirmedAt + input.holdDurationMs + RELEASE_MARGIN_MS + SKEW_MS;

/**
 * After the warning, lca-api persists max(confirmedHi + hold, warningHi + 24h) + margin.
 * The warning email arrives before lca-api saves the recomputed value, so a
 * failure here is retried until {@link warningDeadlineExpired}.
 */
export const deadlineSane = (input: {
    releaseAfter: number;
    confirmedAt: number;
    warningArrival: number;
    holdDurationMs: number;
}): boolean =>
    input.releaseAfter >= input.confirmedAt - SKEW_MS + input.holdDurationMs + RELEASE_MARGIN_MS &&
    input.releaseAfter >=
        input.warningArrival + WARNING_HOURS * HOUR + RELEASE_MARGIN_MS - 10 * MINUTE;

/** Only fail `deadline_mismatch` after the Warning step's due time or the grace, whichever is later. */
export const warningDeadlineExpired = (input: {
    now: number;
    warningDueAt: number;
    warningArrival: number;
}): boolean =>
    input.now >= Math.max(input.warningDueAt, input.warningArrival + WARNING_DEADLINE_GRACE_MS);

/** First release attempt waits for the deadline plus skew. */
export const releaseDue = (now: number, releaseAfter: number): boolean =>
    now >= releaseAfter + SKEW_MS;
