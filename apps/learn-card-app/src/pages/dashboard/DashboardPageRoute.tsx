import React, { useState } from 'react';

import { lazyWithRetry } from 'learn-card-base';

import { markDashboardPath } from '../../helpers/dashboardPathMarks';

type DashboardPageComponent = (typeof import('./DashboardPage'))['default'];

let loadedDashboardPage: DashboardPageComponent | null = null;

let resolveDashboardPageLoaded!: () => void;
const dashboardPageLoaded = new Promise<void>(resolve => {
    resolveDashboardPageLoaded = resolve;
});

/** Resolves once the dashboard chunk has loaded. Never starts a load and never rejects. */
export const whenDashboardPageLoaded = (): Promise<void> => dashboardPageLoaded;

const importDashboardPage = () => {
    markDashboardPath('page_chunk_start');
    return import('./DashboardPage').then(module => {
        markDashboardPath('page_chunk_loaded');
        loadedDashboardPage = module.default;
        resolveDashboardPageLoaded();
        return module;
    });
};

const LazyDashboardPage = lazyWithRetry(importDashboardPage);

/** Starts loading the dashboard chunk (ROUTE_PRELOAD['/dashboard']); the lazy path retries failures. */
export const preloadDashboardPage = (): Promise<void> => LazyDashboardPage.preload();

/**
 * The `/dashboard` route component.
 *
 * React.lazy suspends on its first render even when the module has already loaded, so every cold
 * start showed the routes Suspense fallback and waited a retry render before DashboardPage could
 * commit (LC-2415). When the module is already loaded, render it directly. The choice is fixed per
 * mount, so the element type never flips under a mounted tree; before the module loads, this is
 * exactly the old lazy behavior.
 */
export const DashboardPageRoute: React.FC = () => {
    markDashboardPath('page_route_render', true);
    const [Loaded] = useState(() => loadedDashboardPage);
    if (Loaded) {
        markDashboardPath('page_direct');
        return <Loaded />;
    }
    return <LazyDashboardPage />;
};

export default DashboardPageRoute;
