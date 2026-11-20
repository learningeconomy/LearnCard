/**
 * Cold-start URLs that mount DashboardPage without going through ROUTE_PRELOAD
 * (authenticated `/` → Redirect, or a direct `/dashboard` visit). Callers that
 * confirm auth + this destination should preloadDashboardPage while the boot
 * loader is still up so the first mount can page_direct (LC-2415).
 */
export const isDashboardBootLanding = (pathname: string, dashboardAsHome: boolean): boolean =>
    pathname === '/dashboard' || (pathname === '/' && dashboardAsHome);
