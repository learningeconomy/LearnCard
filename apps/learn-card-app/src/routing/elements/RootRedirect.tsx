import React from 'react';
import { Navigate } from 'react-router';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';

import { useDashboardAsHome } from '../../pages/dashboard/hooks/useDashboardAsHome';
import { markDashboardPath } from '../../helpers/dashboardPathMarks';

/** `/`: home when signed in (dashboard or wallet, see useDashboardAsHome), otherwise login. */
export const RootRedirect: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    // When off, `/` lands on `/wallet` (legacy home); `/dashboard` stays routed regardless so
    // existing deep links (e.g. consent-flow `?connected=true` returns) never 404.
    const dashboardAsHome = useDashboardAsHome();
    markDashboardPath(isLoggedIn ? 'root_redirect' : 'root_redirect_login');
    return (
        <Navigate
            replace
            to={isLoggedIn ? (dashboardAsHome ? '/dashboard' : '/wallet') : '/login'}
        />
    );
};
