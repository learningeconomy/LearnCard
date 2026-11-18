import React, { useState } from 'react';

import { lazyWithRetry } from 'learn-card-base';

import { markDashboardPath } from '../../helpers/dashboardPathMarks';

type RoutesComponent = (typeof import('../../Routes'))['Routes'];

let loadedRoutes: RoutesComponent | null = null;

const importRoutes = (): Promise<RoutesComponent> =>
    import('../../Routes').then(module => {
        markDashboardPath('routes_module');
        loadedRoutes = module.Routes;
        return module.Routes;
    });

/**
 * Starts loading the Routes module (AppRouter calls this on mount, while the boot loader is still up).
 * Safe to call repeatedly; failures are left to the lazy path below, which retries.
 */
export const preloadRoutes = (): Promise<void> => importRoutes().then(() => undefined);

const LazyRoutes = lazyWithRetry(() => {
    markDashboardPath('routes_lazy_read');
    return importRoutes().then(Routes => ({ default: Routes }));
});

/**
 * Renders the app's Routes.
 *
 * React.lazy suspends on its first render even when the module has already loaded, and the nearest
 * Suspense boundary above MobileNavBar is FullApp's root one. So on cold start the app shell's first
 * commit (right after walletReady) swapped the whole app for the root fallback and waited for a retry
 * render before the `/` redirect could run (LC-2415). When the module is already loaded, render it
 * directly instead. The choice is fixed per mount, so the element type never flips under a mounted
 * tree; before the module loads, this is exactly the old lazy behavior.
 */
export const RoutesOutlet: React.FC = () => {
    const [Loaded] = useState(() => loadedRoutes);
    if (Loaded) {
        markDashboardPath('routes_direct');
        return <Loaded />;
    }
    return <LazyRoutes />;
};
