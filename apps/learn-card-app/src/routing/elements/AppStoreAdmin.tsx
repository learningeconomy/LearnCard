import React, { Suspense } from 'react';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

import DelayedFallback from '../../components/generic/DelayedFallback';
import RouteTransitionLoader from '../../components/generic/RouteTransitionLoader';

const AppStoreAdminDashboard = lazyWithRetry(
    () => import('../../pages/appStoreAdmin/AdminDashboard')
);
const DeveloperPortalProvider = lazyWithRetry(() =>
    import('../../pages/appStoreDeveloper/DeveloperPortalContext').then(m => ({
        default: m.DeveloperPortalProvider,
    }))
);

/** `/app-store/admin`: the admin dashboard needs DeveloperPortalContext. */
export const AppStoreAdmin: React.FC = () => (
    <Suspense
        fallback={
            <DelayedFallback delayMs={200}>
                <RouteTransitionLoader />
            </DelayedFallback>
        }
    >
        <DeveloperPortalProvider>
            <AppStoreAdminDashboard />
        </DeveloperPortalProvider>
    </Suspense>
);
