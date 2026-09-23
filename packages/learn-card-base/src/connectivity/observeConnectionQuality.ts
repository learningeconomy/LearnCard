/**
 * Passive connection-quality observer.
 *
 * Two evidence feeders for the advisory slow/unstable warning (see
 * `connectionQuality.ts` — quality NEVER gates auth, queries, or the
 * onlineManager):
 *
 *  1. {@link observeConnectionQuality} — a bounded `PerformanceObserver` over
 *     `fetch` / `xmlhttprequest` Resource Timing entries for the configured
 *     FIRST-PARTY API origins (brain service + LearnCloud). It adds no network
 *     traffic of its own and never patches global `fetch`. Entries are ignored
 *     when they are not first-party, are the reachability probe itself, are
 *     cache hits, are known HTTP errors (where `responseStatus` is available),
 *     look like long streams, or completed while the app was backgrounded
 *     (we cannot tell when they started — conservatively dropped).
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
    now?: () => number;
    /** Resource Timing initiator types to observe. */
    observeTypes?: readonly ('fetch' | 'xmlhttprequest' | string)[];
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
    deliveryType?: string;
    responseStatus?: number;
}

export const DEFAULT_MAX_OBSERVED_DURATION_MS = 30_000;
const DEFAULT_OBSERVE_TYPES = ['fetch', 'xmlhttprequest'] as const;

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
    const observeTypes = options.observeTypes ?? DEFAULT_OBSERVE_TYPES;
    const now = options.now ?? (() => Date.now());

    let disconnected = false;

    const handleEntry = (entry: FilteredResourceTiming): void => {
        if (disconnected) return;

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

    for (const type of observeTypes) {
        try {
            // `buffered: false` — we only want requests made from now on, and
            // never want a burst of historical entries on startup.
            observer.observe({ type, buffered: false });
        } catch {
            // Unsupported entry type on this engine — skip it silently.
        }
    }

    return {
        disconnect: () => {
            disconnected = true;
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

    // Browsers throw `TypeError` for fetch-level failures; requiring TypeError
    // OR an explicit network-y message keeps app-bug TypeErrors
    // ("Cannot read properties of undefined") out of the picture — they never
    // match the narrow pattern anyway.
    return true;
};
