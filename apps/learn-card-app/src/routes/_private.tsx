import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { getInAppMessageEntryPath } from 'learn-card-base/in-app-messages/authRedirectHistory';

/** Where a signed-out visitor to a private path goes. Most paths don't come back after login. */
export const loginRedirectFor = (pathname: string): string => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    if (/^\/m\/[^/]+$/.test(path))
        return `/login?redirectTo=${encodeURIComponent(getInAppMessageEntryPath(pathname))}`;
    if (path === '/notifications') return '/login?redirectTo=%2Fnotifications';
    if (path === '/account/secure') return '/login?redirectTo=%2Faccount%2Fsecure';
    return '/login';
};

/** Layout for the routes marked `private` in routing/routeTable.ts. */
export default function PrivateRoutes() {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();
    return isLoggedIn ? <Outlet /> : <Navigate replace to={loginRedirectFor(location.pathname)} />;
}
