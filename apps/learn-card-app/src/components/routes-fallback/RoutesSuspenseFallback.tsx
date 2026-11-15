import React, { useEffect, useReducer } from 'react';

import DelayedFallback from '../generic/DelayedFallback';
import { FallbackMarker, markDashboardPath } from '../../helpers/dashboardPathMarks';
import { whenDashboardPageLoaded } from '../../pages/dashboard/DashboardPageRoute';

const markRoutesFallbackTimer = () => markDashboardPath('routes_fallback_timer', true);

/**
 * The routes Suspense fallback: blank for 200 ms, then `children` (the route loader).
 *
 * EXPERIMENTAL (LC-2415): once the dashboard chunk has loaded, this re-renders itself once on a
 * macrotask. Cold-start traces showed the /dashboard reveal render finishing ~10 ms after the chunk
 * loaded, yet in ~1/4 of runs the commit waited until DelayedFallback's 200 ms timer re-rendered
 * this fallback (React holds a retry-lane commit it considers suspended until any update arrives).
 * This sends the same kind of update as that timer, just as soon as the chunk is ready. It only
 * re-renders a loader; no data, auth, or route state changes. Unmounted fallbacks do nothing.
 */
export const RoutesSuspenseFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [, rerender] = useReducer((n: number) => n + 1, 0);

    useEffect(() => {
        let live = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        void whenDashboardPageLoaded().then(() => {
            if (!live) return;
            timer = setTimeout(() => {
                if (!live) return;
                markDashboardPath('routes_fallback_nudge', true);
                rerender();
            }, 0);
        });
        return () => {
            live = false;
            if (timer !== undefined) clearTimeout(timer);
        };
    }, []);

    return (
        <FallbackMarker boundary="routes">
            <DelayedFallback delayMs={200} onShow={markRoutesFallbackTimer}>
                {children}
            </DelayedFallback>
        </FallbackMarker>
    );
};

export default RoutesSuspenseFallback;
