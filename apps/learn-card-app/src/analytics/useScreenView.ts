import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { normalizeFeedbackRoute, recordFeedbackRoute } from '../feedback/reporting/routeHistory';

import { useAnalytics } from './context';
import { AnalyticsEvents } from './events';

/**
 * Path segments that are pure route words (letters/hyphens only) are kept;
 * anything carrying digits, encodings, or URI characters is collapsed to
 * `:id`. This keeps `screen_name` low-cardinality and guarantees profile
 * ids, credential URIs, and tokens never reach analytics.
 */
export const normalizeScreenName = normalizeFeedbackRoute;

/**
 * Fires `screen_view` on every route change. Mount ONCE at the app root
 * (inside Router context). Consecutive renders of the same normalized
 * screen are deduped.
 */
export const useScreenView = (): void => {
    const { track, isReady } = useAnalytics();
    const { pathname } = useLocation();
    const lastTrackedRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isReady) return;

        const screenName = normalizeScreenName(pathname);
        if (screenName === lastTrackedRef.current) return;
        lastTrackedRef.current = screenName;

        // Feed the feedback route history the same privacy-safe screen name —
        // already `:id`-collapsed, no query string or fragment.
        recordFeedbackRoute(screenName);
        track(AnalyticsEvents.SCREEN_VIEW, { screen_name: screenName });
    }, [pathname, isReady, track]);
};
