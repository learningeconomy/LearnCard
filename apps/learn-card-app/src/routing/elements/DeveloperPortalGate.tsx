import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';

const DeveloperPortalRoutes = lazyWithRetry(
    () => import('../../pages/appStoreDeveloper/DeveloperPortalRoutes')
);
const PublishSignInGate = lazyWithRetry(
    () => import('../../pages/appStoreDeveloper/submit/PublishSignInGate')
);

// Developer portal routes need sign-in, except publish links, which arrive from app builders,
// often before the developer has an account.
export const DeveloperPortalGate: React.FC = () => {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();

    if (isLoggedIn) return <DeveloperPortalRoutes />;
    if (/^\/app-store\/developer\/submit\/?$/.test(location.pathname)) return <PublishSignInGate />;
    return <Navigate replace to="/login" />;
};
