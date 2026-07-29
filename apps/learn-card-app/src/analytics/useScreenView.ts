import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { useAnalytics } from './context';
import { AnalyticsEvents } from './events';

/**
 * Path segments that are pure route words (letters/hyphens only) are kept;
 * anything carrying digits, encodings, or URI characters is collapsed to
 * `:id`. This keeps `screen_name` low-cardinality and guarantees profile
 * ids, credential URIs, and tokens never reach analytics.
 */
const ROUTE_WORD = /^[a-zA-Z][a-zA-Z-]*$/;

export const normalizeScreenName = (pathname: string): string => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return '/';

    return `/${segments.map(segment => (ROUTE_WORD.test(segment) ? segment : ':id')).join('/')}`;
};

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

        track(AnalyticsEvents.SCREEN_VIEW, { screen_name: screenName });
    }, [pathname, isReady, track]);
};
