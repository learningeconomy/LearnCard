/**
 * Passive connection-quality observer.
 *
 * Two evidence feeders for the advisory slow/unstable warning (see
 * `connectionQuality.ts` — quality NEVER gates auth, queries, or the
 * onlineManager):
 *
 *  1. {@link observeConnectionQuality} — a bounded `PerformanceObserver` over
 *     `resource` entries whose `initiatorType` is `fetch` / `xmlhttprequest`
 *     for the configured FIRST-PARTY API origins (brain service + LearnCloud).
 *     It adds no network traffic of its own and never patches global `fetch`.
 *     Entries are ignored when they are not first-party, are the reachability
 *     probe itself, are images/scripts/styles (wrong initiatorType), are cache
 *     hits, are known HTTP errors (where `responseStatus` is available), look
 *     like long streams, were delivered while the app is backgrounded, or
 *     STARTED before the current continuous foreground stretch began (they may
 *     span a background period, which would fake a slow sample).
 *  2. {@link isLikelyTransportError} — an intentionally NARROW classifier for
 *     React Query cache errors. Only browser-shaped fetch transport failures
 *     count. HTTP statuses, cancellations, and arbitrary application errors
 *     never indicate disconnection.
 *
 * `PerformanceObserver` support is optional: without it (older native
 * webviews) the observer is a safe no-op returning `null`. Native WebView
 * support must be manually verified on device.
 *
 * Caveats (documented, heuristic by design):
 *  - A slow SERVER can look like a slow network; copy must stay qualified.
 *  - Cross-origin entries without `Timing-Allow-Origin` still expose
 *    `duration`, but `responseStatus` reads as `0` — HTTP-error filtering
 *    then cannot apply. That is acceptable: this is advisory evidence only.
 *  - A successful probe / healthy samples say NOTHING about brain-service
 *    endpoint health.
 */

import { CONNECTIVITY_PROBE_PATH } from './probeConnectivity';

export interface ObservedConnectionSample {
    at: number;
    /** Always `true` here: only completed (non-HTTP-error) entries are reported. */
    ok: boolean;
    durationMs: number;
    /** The request URL the entry was recorded for. */
    url: string;
}

export interface ObserveConnectionQualityOptions {
    /** First-party API origins whose fetch/XHR timing counts as evidence. */
    origins: readonly string[];
    /** Called for each surviving entry (already bounded + filtered). */
    onSample: (sample: ObservedConnectionSample) => void;
    /** Pathnames to ignore — defaults to the connectivity probe path. */
    excludePathnames?: readonly string[];
    /** Entries longer than this are treated as long streams — default 30s. */
    maxDurationMs?: number;
    /** Return `false` while backgrounded; those samples are dropped. */
    isForeground?: () => boolean;
    /**
     * Push-based foreground transitions (document `visibilitychange`, native
     * `appStateChange`). With transitions the observer can exclude requests
     * that STARTED before the current foreground stretch began — they may
     * have spent most of their life backgrounded. Without it the observer
     * falls back to delivery-time `isForeground` checks only.
     */
    onForegroundChange?: (listener: (foreground: boolean) => void) => () => void;
    /** Test seam + monotonic clock matching Resource Timing `startTime`. */
    performanceNow?: () => number;
    now?: () => number;
    /** Resource Timing `initiatorType` values that count as evidence. */
    initiatorTypes?: readonly string[];
    /** Test seam. Defaults to the global `PerformanceObserver` when present. */
    PerformanceObserverCtor?: typeof PerformanceObserver;
}

export interface ConnectionQualityObserver {
    /** Stop observing; safe to call more than once. */
    disconnect: () => void;
}

interface FilteredResourceTiming {
    name: string;
    duration: number;
    /** Resource Timing initiator type (`fetch`, `xmlhttprequest`, `img`, …). */
    initiatorType?: string;
    /** Start time in the same monotonic clock as `performance.now()`. */
    startTime?: number;
    deliveryType?: string;
    responseStatus?: number;
}

export const DEFAULT_MAX_OBSERVED_DURATION_MS = 30_000;
/** `initiatorType` values that mean a real first-party API request. */
export const DEFAULT_EVIDENCE_INITIATOR_TYPES = ['fetch', 'xmlhttprequest'] as const;
/** The only valid PerformanceEntry type for Resource Timing observations. */
const RESOURCE_ENTRY_TYPE = 'resource';

export const observeConnectionQuality = (
    options: ObserveConnectionQualityOptions
): ConnectionQualityObserver | null => {
    const PerformanceObserverCtor =
        options.PerformanceObserverCtor ??
        (typeof globalThis.PerformanceObserver !== 'undefined'
            ? globalThis.PerformanceObserver
            : undefined);

    // Older native webviews / environments without Resource Timing: safe no-op.
    if (!PerformanceObserverCtor) return null;

    const origins = new Set(options.origins);
    if (origins.size === 0) return null;

    const excludedPaths = new Set(options.excludePathnames ?? [CONNECTIVITY_PROBE_PATH]);
    const maxDurationMs = options.maxDurationMs ?? DEFAULT_MAX_OBSERVED_DURATION_MS;
    const initiatorTypes = new Set(options.initiatorTypes ?? DEFAULT_EVIDENCE_INITIATOR_TYPES);
    const now = options.now ?? (() => Date.now());
    const perfNow =
        options.performanceNow ??
        (typeof globalThis.performance?.now === 'function'
            ? () => globalThis.performance.now()
            : () => Date.now());

    let disconnected = false;

    // Foreground-epoch tracking: when the current continuous foreground
    // stretch began, in the same monotonic clock as Resource Timing
    // `startTime`. `null` while backgrounded. Initialized from the current
    // foreground state; requests that started before the observer learned of
    // the latest resume are conservatively dropped.
    let foregroundSince: number | null =
        options.isForeground && !options.isForeground() ? null : perfNow();
    const unsubscribeForeground = options.onForegroundChange?.((foreground: boolean) => {
        if (disconnected) return;
        foregroundSince = foreground ? perfNow() : null;
    });

    const handleEntry = (entry: FilteredResourceTiming): void => {
        if (disconnected) return;

        // Only real API requests count: `fetch` / `xmlhttprequest`
        // initiatorTypes. Images, scripts, styles, beacons, … are shaped by
        // caching/CDNs and say nothing about network quality — even on a
        // first-party origin.
        if (!initiatorTypes.has(entry.initiatorType ?? '')) return;

        let parsed: URL;
        try {
            parsed = new URL(entry.name);
        } catch {
            return;
        }

        if (!origins.has(parsed.origin)) return;
        if (excludedPaths.has(parsed.pathname)) return;
        // Known cache hits prove nothing about the network ("when known").
        if (entry.deliveryType === 'cache') return;
        // HTTP errors (where the status is visible) are application-level,
        // not network evidence — and must never be instability samples.
        if (typeof entry.responseStatus === 'number' && entry.responseStatus >= 400) return;
        // Long streams (uploads/downloads, AI sessions) are not latency samples.
        if (entry.duration > maxDurationMs) return;
        // Entries delivered while backgrounded may span the background — drop.
        if (options.isForeground && !options.isForeground()) return;
        // A request that STARTED before the current foreground stretch began
        // may have been stalled in the background — its duration is not
        // foreground network evidence. (A missing `startTime` reads as
        // "delivered now", preserving delivery-time-only behavior.)
        const startedAt = typeof entry.startTime === 'number' ? entry.startTime : perfNow();
        if (foregroundSince === null || startedAt < foregroundSince) return;

        options.onSample({
            at: now(),
            ok: true,
            durationMs: entry.duration,
            url: entry.name,
        });
    };

    const observer = new PerformanceObserverCtor(list => {
        try {
            list.getEntries().forEach(entry => handleEntry(entry as FilteredResourceTiming));
        } catch {
            // Observing must never break the host app.
        }
    });

    try {
        // `type: 'resource'` is the ONLY valid PerformanceEntry type for
        // Resource Timing — `fetch`/`xmlhttprequest` are initiatorType VALUES,
        // not entry types (observing them throws on real browsers). Entries
        // are filtered by `initiatorType` instead. `buffered: false` — we only
        // want requests made from now on, and never want a burst of
        // historical entries on startup.
        observer.observe({ type: RESOURCE_ENTRY_TYPE, buffered: false });
    } catch {
        // Unsupported entry type on this engine — the observer becomes a
        // quiet no-op (still safely disconnectable).
    }

    return {
        disconnect: () => {
            disconnected = true;
            try {
                unsubscribeForeground?.();
            } catch {
                // Host-provided unsubscribe must never throw through us.
            }
            try {
                observer.disconnect();
            } catch {
                // Already disconnected / unsupported — nothing to do.
            }
        },
    };
};

/**
 * Message shapes that browsers/w webviews use for fetch transport failures.
 * Kept deliberately narrow — matched against the full message, lowercased.
 */
export const TRANSPORT_ERROR_MESSAGE_PATTERN =
    /failed to fetch|fetch failed|networkerror|network error|load failed|network request failed|network connection was lost|err_(connection|internet|network|address|name_not_resolved)|connection (refused|reset|closed|timed out)|socket hang up/i;

/**
 * Conservative classifier for React Query cache errors: is this plausibly a
 * NETWORK transport failure? When in doubt the answer is NO — HTTP/application
 * errors, cancellations and arbitrary `Error`s must never look like a
 * disconnection, because a false "offline" claim is what this ticket fixes.
 *
 * Recognized as transport:
 *  - `TypeError("Failed to fetch")` (Chrome/Edge) and `TypeError` variants
 *    ("Load failed" — Safari, "NetworkError…" — Firefox, covered by pattern).
 *  - Messages matching {@link TRANSPORT_ERROR_MESSAGE_PATTERN}.
 *
 * Never transport (returns `false`):
 *  - `AbortError` / `TimeoutError` (React Query cancellation / app deadlines).
 *  - Errors carrying an HTTP status or response object (4xx/5xx, tRPC, HTTP
 *    exceptions).
 *  - Any other `Error` (business logic, signing, parsing, GraphQL, axios
 *    `ERR_CANCELED`, …). Unsupported error shapes stay conservatively
 *    unclassified.
 */
export const isLikelyTransportError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return false;

    // Errors that carry an HTTP response/status are application-level by
    // definition — even when their message would otherwise match.
    const annotated = error as { status?: unknown; statusCode?: unknown; response?: unknown };
    if (
        typeof annotated.status === 'number' ||
        typeof annotated.statusCode === 'number' ||
        annotated.response !== undefined
    ) {
        return false;
    }

    if (!TRANSPORT_ERROR_MESSAGE_PATTERN.test(error.message ?? '')) return false;

    // Match the narrow network-message pattern regardless of Error subclass;
    // unrelated TypeErrors (e.g. accessing undefined) never pass it.
    return true;
};
