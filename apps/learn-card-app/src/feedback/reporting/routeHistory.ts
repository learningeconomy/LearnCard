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

const ROUTE_WORD = /^[a-zA-Z][a-zA-Z-]*$/;

/**
 * Reviewed dynamic routes whose parameters may legally contain only letters
 * or hyphens. Shape-based sanitization cannot distinguish those values from
 * static route words, so match the application's declared templates first.
 * Keep more-specific templates before their dynamic siblings.
 */
const DYNAMIC_ROUTE_TEMPLATES = [
    '/app-store/developer/integrations/:integrationId/apps/new',
    '/app-store/developer/integrations/:integrationId/apps/:listingId',
    '/app-store/developer/integrations/:integrationId/apps',
    '/app-store/developer/integrations/:integrationId/guides/:useCase',
    '/app-store/developer/integrations/:integrationId/guides',
    '/app-store/developer/integrations/:integrationId',
    '/app-store/developer/guides/:useCase',
    '/app-store/developer/edit/:listingId',
    '/interactions/guardian-credential-approval/:token',
    '/interactions/guardian-approval/:token',
    '/pathways/node/:pathwayId/:nodeId',
    '/share-creds/:uri/:seed',
    '/select-credentials/:profileId',
    '/view-shared-credentials/:profileId',
    '/claim-credential/:uri',
    '/did-auth/:challenge',
    '/connect/:profileId',
    '/apps/:appId',
    '/app/:listingId',
] as const;

const matchesTemplate = (segments: string[], template: string): boolean => {
    const templateSegments = template.split('/').filter(Boolean);
    if (segments.length !== templateSegments.length) return false;

    return templateSegments.every(
        (templateSegment, index) =>
            templateSegment.startsWith(':') || templateSegment === segments[index]
    );
};

/** Normalize a pathname without retaining dynamic identifiers. */
export const normalizeFeedbackRoute = (pathname: string): string => {
    const pathOnly = pathname.split(/[?#]/, 1)[0];
    const segments = pathOnly.split('/').filter(Boolean);
    if (segments.length === 0) return '/';

    const matchedTemplate = DYNAMIC_ROUTE_TEMPLATES.find(template =>
        matchesTemplate(segments, template)
    );
    if (matchedTemplate) return matchedTemplate;

    return `/${segments.map(segment => (ROUTE_WORD.test(segment) ? segment : ':id')).join('/')}`;
};

let recentRoutes: string[] = [];

/**
 * Record a normalized route. Consecutive duplicates are collapsed so
 * re-renders of the same screen never push the buffer forward, and only the
 * newest `MAX_ROUTE_HISTORY` entries are kept.
 */
export const recordFeedbackRoute = (route: string): void => {
    const normalizedRoute = normalizeFeedbackRoute(route);
    if (recentRoutes[recentRoutes.length - 1] === normalizedRoute) return;

    recentRoutes.push(normalizedRoute);
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
