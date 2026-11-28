import React, { useLayoutEffect } from 'react';

import { isDebugEnvironmentEnabled } from '../config/environment';

/**
 * Debug-build timing marks on the cold-start path from walletReady to the dashboard (LC-2415).
 *
 * Same contract as markStartupPhase: debug environments only, fixed step names only, never account
 * or credential data. Marks use the `learncard:startup:` prefix so the bench collector records them.
 * In production builds every function here is a no-op and FallbackMarker renders its children as-is.
 */
export type DashboardPathStep =
    | 'shell_commit' // AppRouter swapped the boot loader for the app shell
    | 'routes_render' // RoutesOutlet rendered (may still suspend below)
    | 'routes_commit' // RoutesOutlet committed
    | 'root_redirect' // `/` rendered its logged-in redirect
    | 'root_redirect_login' // `/` rendered its logged-out redirect
    | 'page_chunk_start' // DashboardPage's chunk was first requested (preload or lazy render)
    | 'page_chunk_loaded' // ...and its module promise resolved
    | 'page_direct' // /dashboard mounted DashboardPage without suspending (chunk already loaded)
    | 'page_route_render' // DashboardPageRoute rendered (marked every render)
    | 'page_body_render' // DashboardPage's body rendered (marked every render; renders may be discarded)
    | 'dashboard_commit' // DashboardPage committed
    | 'root_fallback_shown' // FullApp's root Suspense fallback committed
    | 'root_fallback_hidden' // ...and was replaced by content
    | 'routes_fallback_shown' // Routes' own Suspense fallback committed
    | 'routes_fallback_hidden'
    | 'routes_fallback_timer' // Routes' DelayedFallback 200 ms timer fired (a state update in the fallback)
    | 'longtask' // a main-thread long task started (PerformanceObserver; marked at its start time)
    | 'longtask_end'; // ...and ended (start time + duration)

export const DASHBOARD_PATH_MARK_PREFIX = 'learncard:startup:dash_';

const marked = new Set<DashboardPathStep>();

/** Marks `step` (only its first occurrence unless `every` is set) in debug environments. */
export const markDashboardPath = (step: DashboardPathStep, every = false): void => {
    if (!isDebugEnvironmentEnabled() || typeof performance?.mark !== 'function') return;
    if (!every && marked.has(step)) return;
    marked.add(step);
    performance.mark(`${DASHBOARD_PATH_MARK_PREFIX}${step}`);
};

/** Marks `step` when the calling component commits with `active` true. */
export const useDashboardPathMark = (step: DashboardPathStep, active = true): void => {
    useLayoutEffect(() => {
        if (active) markDashboardPath(step);
    }, [step, active]);
};

/** Wraps a Suspense fallback to mark every time it is shown and hidden. Renders children unchanged. */
export const FallbackMarker: React.FC<{
    boundary: 'root' | 'routes';
    children: React.ReactNode;
}> = ({ boundary, children }) => {
    useLayoutEffect(() => {
        markDashboardPath(`${boundary}_fallback_shown`, true);
        return () => markDashboardPath(`${boundary}_fallback_hidden`, true);
    }, [boundary]);
    return <>{children}</>;
};

let observingLongTasks = false;

/**
 * Debug only: marks every main-thread long task as `longtask` / `longtask_end` pairs at the task's own
 * start and end times, so a startup trace can tell a blocked main thread from a held React commit.
 * No-op where the `longtask` entry type is unsupported.
 */
export const observeDashboardLongTasks = (): void => {
    if (observingLongTasks || !isDebugEnvironmentEnabled()) return;
    if (typeof PerformanceObserver === 'undefined' || typeof performance?.mark !== 'function')
        return;
    if (!PerformanceObserver.supportedEntryTypes?.includes('longtask')) return;
    observingLongTasks = true;
    try {
        new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
                performance.mark(`${DASHBOARD_PATH_MARK_PREFIX}longtask`, {
                    startTime: entry.startTime,
                });
                performance.mark(`${DASHBOARD_PATH_MARK_PREFIX}longtask_end`, {
                    startTime: entry.startTime + entry.duration,
                });
            }
        }).observe({ type: 'longtask' });
    } catch {
        observingLongTasks = false;
    }
};

/** Test-only: forget which steps were marked. */
export const resetDashboardPathMarks = (): void => marked.clear();
