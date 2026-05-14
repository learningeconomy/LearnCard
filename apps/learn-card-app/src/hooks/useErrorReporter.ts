/**
 * Generic "user-reported error" fan-out for feature screens.
 *
 * Any screen that shows the user an error with a "Tell LearnCard about
 * this" affordance can reach for this hook to get the same two-rail
 * fan-out: engineering telemetry (Sentry, auto-grouped + tagged) and
 * product telemetry (the analytics provider configured for the tenant,
 * typed via the `AnalyticsEventPayloads` catalog).
 *
 * Why the two rails stay independent:
 *   - Sentry ingests stack traces; analytics providers don't.
 *   - Analytics ingests product-prioritization events; Sentry dedupes
 *     at the error-fingerprint level which destroys "how many users
 *     hit *this feature* this week" queries.
 *   - A failure in one rail must never silence the other, so each
 *     side is wrapped independently.
 *
 * Domain wrappers (e.g. `useExchangeErrorReporting` for OID4VC,
 * `useVerifyErrorReporting` for credential-verify, `useSyncErrorReporting`
 * for wallet sync, ...) bind the `feature` + `analyticsEvent` once at
 * hook-creation time and translate domain concepts into Sentry tags
 * and analytics payload fields. Call sites then only pass the error
 * and any per-report context.
 */

import { useCallback } from 'react';
import * as Sentry from '@sentry/react';

import { useAnalytics } from '../analytics/context';
import type {
    AnalyticsEventName,
    AnalyticsEventPayloads,
    EventPayload,
} from '../analytics/events';

/**
 * Per-report options passed at call time.
 *
 * The analytics payload is typed against `EventPayload<E>` so each
 * domain wrapper gets compiler-enforced catalog conformance without
 * the generic layer having to know about any specific event.
 */
export interface ReportErrorOptions<E extends AnalyticsEventName> {
    /**
     * Indexed Sentry tags. Keep values short (< 200 chars) and stable
     * so they can be grouped / faceted in Sentry search. `undefined`
     * values are dropped before emit so callers can pass
     * `tags: { code, errorName }` without conditional spreads.
     */
    tags?: Record<string, string | undefined>;

    /**
     * Non-indexed Sentry data. Use for free-form context (stack
     * fragments, request IDs, full objects) that you want visible on
     * the issue page but not as a search dimension.
     */
    extra?: Record<string, unknown>;

    /**
     * Optional user-supplied free text from the report textarea.
     * Forwarded as `extra.userNote` on Sentry (NOT a tag — tags are
     * indexed and PII-leaky) and merged into the analytics payload.
     * Treat as user PII downstream.
     */
    userNote?: string;

    /**
     * Fully-typed payload for the analytics event. The domain wrapper
     * populates this; the generic layer just passes it through to
     * `analytics.track`.
     */
    analyticsPayload: EventPayload<E>;
}

/**
 * Configure a feature-specific error reporter. Returns a stable
 * callback suitable for passing to `ExchangeErrorDisplay`'s `onReport`
 * prop (or any similar "tell us about this" hook point).
 *
 * @example
 * ```ts
 * const report = useErrorReporter({
 *     feature: 'credential-verify',
 *     analyticsEvent: AnalyticsEvents.CREDENTIAL_VERIFY_ERROR_REPORTED,
 * });
 *
 * await report(err, {
 *     tags: { format: 'jwt-vc', reason: 'signature' },
 *     extra: { credentialId },
 *     userNote,
 *     analyticsPayload: { format: 'jwt-vc', reason: 'signature', userNote },
 * });
 * ```
 */
export const useErrorReporter = <E extends AnalyticsEventName>(config: {
    /**
     * Feature namespace. Used as the `feature` Sentry tag and serves
     * as a filter key in both Sentry and the analytics provider.
     * Should be a stable, kebab-case string: `openid4vc`,
     * `credential-verify`, `wallet-sync`.
     */
    feature: string;

    /**
     * Typed analytics event name from the catalog. The payload type
     * is propagated into `ReportErrorOptions<E>['analyticsPayload']`
     * so call sites get full type-checking of the product payload.
     */
    analyticsEvent: E;
}) => {
    const { feature, analyticsEvent } = config;
    const { track } = useAnalytics();

    return useCallback(
        async (error: unknown, options: ReportErrorOptions<E>): Promise<void> => {
            // ----- Engineering surface: Sentry exception -----
            // Wrapped independently of analytics so a Sentry SDK hiccup
            // (misconfigured DSN, transport down, etc.) can't suppress
            // the product-telemetry event.
            try {
                Sentry.captureException(error, {
                    tags: {
                        feature,
                        ...stripUndefinedValues(options.tags),
                    },
                    extra: {
                        ...options.extra,
                        userNote: options.userNote,
                    },
                });
            } catch (sentryFailure) {
                // eslint-disable-next-line no-console
                console.error('[useErrorReporter] Sentry capture failed', sentryFailure);
            }

            // ----- Product surface: analytics event -----
            // `track` is typed so `analyticsPayload` must match
            // `AnalyticsEventPayloads[E]`; this gives us catalog
            // conformance without the generic layer knowing any
            // specific event's shape.
            try {
                await track(analyticsEvent, options.analyticsPayload);
            } catch (analyticsFailure) {
                // eslint-disable-next-line no-console
                console.error('[useErrorReporter] analytics track failed', analyticsFailure);
            }
        },
        [feature, analyticsEvent, track]
    );
};

// -----------------------------------------------------------------
// Error-shape helpers — generic extractors for plugin-style errors.
// Exported so every domain wrapper uses the same rules (a `VciError`
// and a `RequestObjectError` should both produce the same `code` /
// `errorName` tag shape).
// -----------------------------------------------------------------

/**
 * Pull a stable `code` off plugin-shaped errors. Returns `undefined`
 * for anything without a string `code` so the analytics payload
 * doesn't get polluted with stringified objects or numeric codes that
 * mean different things across providers.
 */
export const extractErrorCode = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
};

/**
 * Pull `error.name` (e.g. `VciError`, `RequestObjectError`). Used for
 * splitting aggregate counts by which module surfaced the error.
 * Defaults to `undefined` for the generic `Error` constructor name so
 * we don't store `'Error'` as a meaningless dimension.
 */
export const extractErrorName = (error: unknown): string | undefined => {
    if (!error || typeof error !== 'object') return undefined;
    const name = (error as { name?: unknown }).name;
    if (typeof name !== 'string' || name === 'Error') return undefined;
    return name;
};

/**
 * Wallet build version from Vite's define-plugin (`VITE_APP_VERSION`).
 * Returns `undefined` rather than a magic string so downstream queries
 * can drop the field cleanly instead of deduping `'unknown'`.
 */
export const getWalletVersion = (): string | undefined => {
    const v = (import.meta as { env?: Record<string, string | undefined> }).env
        ?.VITE_APP_VERSION;
    return v && v.length > 0 ? v : undefined;
};

// -----------------------------------------------------------------
// Internals
// -----------------------------------------------------------------

/**
 * Drop `undefined` values from a tag bag. Sentry's `tags` field
 * silently stringifies `undefined` to `"undefined"` otherwise, which
 * leaks into facet queries.
 */
const stripUndefinedValues = (
    tags: Record<string, string | undefined> | undefined
): Record<string, string> => {
    if (!tags) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(tags)) {
        if (typeof value === 'string' && value.length > 0) {
            out[key] = value;
        }
    }
    return out;
};

// Re-export for convenience so domain wrappers can import the full
// surface from one place.
export type { AnalyticsEventName, AnalyticsEventPayloads, EventPayload };
