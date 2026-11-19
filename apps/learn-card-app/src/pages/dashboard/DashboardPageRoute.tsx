import React, { useState } from 'react';

import { lazyWithRetry } from 'learn-card-base';

import { prefetchChunk } from '../../helpers/prefetchChunk';
import { markDashboardPath } from '../../helpers/dashboardPathMarks';

type DashboardPageComponent = (typeof import('./DashboardPage'))['default'];

let loadedDashboardPage: DashboardPageComponent | null = null;

const importDashboardPage = () => {
    markDashboardPath('page_chunk_start');
    return import('./DashboardPage').then(module => {
        markDashboardPath('page_chunk_loaded');
        loadedDashboardPage = module.default;
        return module;
    });
};

const LazyDashboardPage = lazyWithRetry(importDashboardPage);

/** Starts loading the dashboard chunk (ROUTE_PRELOAD['/dashboard']); the lazy path retries failures. */
export const preloadDashboardPage = (): Promise<void> => LazyDashboardPage.preload();

/**
 * Early-boot / speculative warm for `/dashboard` (LC-2437).
 *
 * fetch() the chunk files into the HTTP cache only — never import() here. A failed
 * speculative import (e.g. 503 after a successful fetch warm under Cache-Control:
 * no-cache) poisons Firefox / some Chromium module maps, so the recovered server
 * still serves a failed module on the next open. Import stays on navigation via
 * ROUTE_PRELOAD['/dashboard'] → warmThenImport → preloadDashboardPage (LC-2415
 * page_direct still happens when the user selects dashboard).
 */
export const warmDashboardPage = (): Promise<void> =>
    prefetchChunk('dashboard').then(() => undefined);

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
