/**
 * Connection quality policy — advisory "slow / unstable" signal.
 *
 * This is intentionally separate from reachability (`connectivityStore`).
 * Quality NEVER participates in gating decisions (auth, React Query
 * `onlineManager`, boot gates). It only drives a visible advisory warning.
 *
 * The policy is heuristic evidence accumulation, not a bandwidth measurement:
 *
 *  - Evidence is the last `maxSamples` eligible samples inside a rolling
 *    `windowMs` window (default: last 5 samples within 60s).
 *  - Quality becomes `poor` when there are at least `minSamplesForPoor`
 *    samples AND at least `poorCount` of them are slow (> `slowMs`) or
 *    transport failures. Failures map to reason `'unstable'`, latency to
 *    `'slow'`; any failure among the poor evidence means `'unstable'`.
 *  - `consecutiveHealthyToClear` consecutive healthy successes (< `healthyMs`)
 *    clear the warning and reset the evidence window.
 *  - Stale evidence (older than `windowMs`) expires so an old bad patch never
 *    keeps the warning alive. With no live evidence the tracker reports
 *    `unknown` (or stays `good` if it was explicitly cleared by healthy
 *    traffic) — a single isolated slow response must never warn.
 *
 * Callers supply samples; the module never performs I/O and has no
 * browser/native globals, so it is trivially testable.
 */

export const CONNECTION_QUALITY_THRESHOLDS = {
    /** Samples slower than this are counted as "slow". */
    slowMs: 2500,
    /** Successes faster than this count as "healthy" for clearing the warning. */
    healthyMs: 1500,
    /** Rolling evidence window. Older samples expire. */
    windowMs: 60_000,
    /** Minimum number of live samples required before `poor` can be declared. */
    minSamplesForPoor: 3,
    /** How many slow/failed live samples trigger `poor`. */
    poorCount: 3,
    /** Maximum number of live samples retained (oldest dropped first). */
    maxSamples: 5,
    /** Consecutive healthy successes that clear a `poor` warning. */
    consecutiveHealthyToClear: 3,
} as const;

export type ConnectionQualityThresholds = typeof CONNECTION_QUALITY_THRESHOLDS;

export type ConnectionQuality = 'unknown' | 'good' | 'poor';

export type ConnectionQualityReason = 'slow' | 'unstable';

export type ConnectionQualitySampleSource = 'probe' | 'observed';

export interface ConnectionQualitySample {
    /** Epoch millis at which the sample was taken. */
    at: number;
    /** `false` marks a transport-level failure (timeout, network error). */
    ok: boolean;
    /** Observed duration in millis. Required for `ok` samples to count as healthy/slow. */
    durationMs?: number;
    /** Where the sample came from (the reachability probe or a real request). */
    source?: ConnectionQualitySampleSource;
}

export interface ConnectionQualitySnapshot {
    quality: ConnectionQuality;
    reason: ConnectionQualityReason | null;
}

export interface ConnectionQualityTracker {
    /** Record a sample and return the recomputed snapshot. */
    reportSample: (sample: ConnectionQualitySample) => ConnectionQualitySnapshot;
    /** Current snapshot without recording anything. */
    snapshot: () => ConnectionQualitySnapshot;
    /** Drop all evidence (used by tests and by `reset`-style flows). */
    reset: () => void;
    /**
     * Epoch millis at which the live-evidence set next changes (the earliest
     * live sample's expiry), or `null` when nothing is live. Callers use this
     * to schedule a local expiry timer — NOT a network poll.
     */
    nextExpiryAt: () => number | null;
    /** Samples currently retained (always ≤ `maxSamples`). Tests/diagnostics. */
    retainedCount: () => number;
}

export interface CreateConnectionQualityTrackerOptions {
    thresholds?: Partial<ConnectionQualityThresholds>;
    now?: () => number;
}

const isSlow = (
    sample: ConnectionQualitySample,
    thresholds: ConnectionQualityThresholds
): boolean => typeof sample.durationMs === 'number' && sample.durationMs > thresholds.slowMs;

const isHealthy = (
    sample: ConnectionQualitySample,
    thresholds: ConnectionQualityThresholds
): boolean =>
    sample.ok && typeof sample.durationMs === 'number' && sample.durationMs <= thresholds.healthyMs;

/**
 * Live samples: inside the window, capped to the most recent `maxSamples`.
 * Also used as the retention trim on insertion so the retained array itself
 * can never grow without bound under repeated slow/failing traffic.
 */
export const selectLiveSamples = (
    samples: readonly ConnectionQualitySample[],
    now: number,
    thresholds: ConnectionQualityThresholds
): ConnectionQualitySample[] =>
    samples.filter(sample => sample.at > now - thresholds.windowMs).slice(-thresholds.maxSamples);

export const createConnectionQualityTracker = (
    options: CreateConnectionQualityTrackerOptions = {}
): ConnectionQualityTracker => {
    const thresholds: ConnectionQualityThresholds = {
        ...CONNECTION_QUALITY_THRESHOLDS,
        ...options.thresholds,
    };
    const now = options.now ?? (() => Date.now());

    let samples: ConnectionQualitySample[] = [];
    /** Set once consecutive healthy successes have cleared a warning. */
    let clearedToGood = false;

    const evaluate = (): ConnectionQualitySnapshot => {
        const live = selectLiveSamples(samples, now(), thresholds);

        if (live.length > 0) {
            const slowCount = live.filter(
                sample => !sample.ok || isSlow(sample, thresholds)
            ).length;
            const failureCount = live.filter(sample => !sample.ok).length;

            if (live.length >= thresholds.minSamplesForPoor && slowCount >= thresholds.poorCount) {
                // Offline display precedence is handled above this module;
                // among poor evidence, any transport failure means
                // 'unstable' (failures win when both failure and latency are
                // present) — pure latency evidence is 'slow'.
                const reason: ConnectionQualityReason = failureCount > 0 ? 'unstable' : 'slow';
                clearedToGood = false;
                return { quality: 'poor', reason };
            }

            // Count trailing consecutive healthy successes.
            let trailingHealthy = 0;
            for (let i = live.length - 1; i >= 0; i -= 1) {
                if (isHealthy(live[i], thresholds)) trailingHealthy += 1;
                else break;
            }

            if (trailingHealthy >= thresholds.consecutiveHealthyToClear) {
                // Clear the warning and the evidence that produced it so a
                // single later slow response starts fresh instead of
                // resurrecting the old bad patch.
                samples = [];
                clearedToGood = true;
                return { quality: 'good', reason: null };
            }
        }

        // Either no live evidence (all expired) or not enough to warn
        // (isolated slow responses). Never warn from this: report `good` only
        // if it was explicitly established by consecutive healthy successes,
        // otherwise there is nothing verified to claim.
        return clearedToGood
            ? { quality: 'good', reason: null }
            : { quality: 'unknown', reason: null };
    };

    return {
        reportSample: sample => {
            // Trim ON INSERTION (window + maxSamples cap): repeated slow or
            // failing traffic must not grow the retained array forever. The
            // evaluation below sees exactly the same live set as before.
            samples = selectLiveSamples([...samples, { ...sample }], now(), thresholds);
            return evaluate();
        },
        snapshot: evaluate,
        reset: () => {
            samples = [];
            clearedToGood = false;
        },
        nextExpiryAt: () => {
            const t = now();
            const live = samples.filter(sample => sample.at > t - thresholds.windowMs);
            if (live.length === 0) return null;
            return Math.min(...live.map(sample => sample.at)) + thresholds.windowMs;
        },
        retainedCount: () => samples.length,
    };
};

/**
 * Display-level combination of reachability and quality. Offline always takes
 * precedence over the advisory quality warning; a `poor` quality with a
 * reachable network is the slow/unstable case.
 */
export const resolveAdvisoryQuality = (
    status: 'unknown' | 'online' | 'offline',
    quality: ConnectionQuality
): ConnectionQuality => (status === 'offline' ? 'unknown' : quality);
