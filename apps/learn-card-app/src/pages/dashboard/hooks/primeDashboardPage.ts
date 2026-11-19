import { waitForPrefetch } from '../../../helpers/prefetchChunk';

import { preloadDashboardPage } from '../DashboardPageRoute';

/**
 * Bounds the *whole* boot wait (waitForPrefetch + import) so a hung module
 * import() cannot leave LoginLoadingPage / the login redirect overlay up
 * forever. waitForPrefetch alone only caps the fetch warm (~3s); this covers
 * the import too. On timeout we release the loader and let Suspense handle the
 * still-in-flight import (LC-2415 / goblincore on #2107).
 */
export const DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS = 4000;

/** True when a post-auth path will mount DashboardPageRoute (ignores query/hash). */
export const isDashboardDestinationPath = (path: string): boolean => {
    const pathname = path.split(/[?#]/, 1)[0] ?? '';
    return pathname === '/dashboard';
};

/** Wait for any in-flight fetch warm, then import. May hang if import() hangs. */
export const primeDashboardPage = async (): Promise<void> => {
    await waitForPrefetch('dashboard');
    await preloadDashboardPage();
};

/**
 * Like primeDashboardPage, but resolves after DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS
 * even if import() is still pending. The import keeps running in the background.
 */
export const primeDashboardPageBounded = async (
    timeoutMs: number = DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS
): Promise<'done' | 'timeout'> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            primeDashboardPage()
                .then(() => 'done' as const)
                .catch(() => 'done' as const),
            new Promise<'timeout'>(resolve => {
                timer = setTimeout(() => resolve('timeout'), timeoutMs);
            }),
        ]);
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
};

/** Prime only when `path` lands on dashboard; no-op otherwise. Always settles. */
export const primeDashboardIfDestination = async (path: string): Promise<void> => {
    if (!isDashboardDestinationPath(path)) return;
    await primeDashboardPageBounded();
};
