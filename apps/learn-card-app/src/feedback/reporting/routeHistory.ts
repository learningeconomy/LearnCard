/**
 * Bounded, memory-only route history for feedback reports.
 *
 * Routes are recorded by `useScreenView` after passing through
 * `normalizeScreenName`, so entries already carry `:id` placeholders instead
 * of raw identifiers and never contain query strings or fragments. The
 * buffer is intentionally module-local: nothing is persisted, and the read
 * API hands out a snapshot so consumers cannot mutate the backing array.
 */

/** Maximum number of recent routes retained in memory. Exactly ten per the LC-2086 spec. */
const MAX_ROUTE_HISTORY = 10;

let recentRoutes: string[] = [];

/**
 * Record a normalized route. Consecutive duplicates are collapsed so
 * re-renders of the same screen never push the buffer forward, and only the
 * newest `MAX_ROUTE_HISTORY` entries are kept.
 */
export const recordFeedbackRoute = (route: string): void => {
    if (recentRoutes[recentRoutes.length - 1] === route) return;

    recentRoutes.push(route);
    if (recentRoutes.length > MAX_ROUTE_HISTORY) {
        recentRoutes = recentRoutes.slice(-MAX_ROUTE_HISTORY);
    }
};

/**
 * Snapshot of the most recent routes, oldest first. Returns a defensive
 * copy — mutating the result never affects the internal buffer.
 */
export const getRecentFeedbackRoutes = (): string[] => [...recentRoutes];

/**
 * Clear the route history buffer.
 */
export const clearFeedbackRouteHistory = (): void => {
    recentRoutes = [];
};
