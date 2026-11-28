import React, { Suspense } from 'react';
import { Outlet, useRoutes } from 'react-router';
import * as Sentry from '@sentry/react';
import { ChunkBoundary } from 'learn-card-base';

import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import DelayedFallback from '../generic/DelayedFallback';
import RouteTransitionLoader from '../generic/RouteTransitionLoader';
import {
    FallbackMarker,
    markDashboardPath,
    useDashboardPathMark,
} from '../../helpers/dashboardPathMarks';
import { ROUTE_TABLE } from '../../routing/routeTable';

const markRoutesFallbackTimer = () => markDashboardPath('routes_fallback_timer', true);

// Sentry's React Router integration names pageload and navigation transactions after the matched
// pattern (https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/).
// It learns the patterns from a wrapped useRoutes; these element-less routes render nothing.
const useSentryRoutes = Sentry.wrapUseRoutes(useRoutes);
const SENTRY_ROUTES = ROUTE_TABLE.map(({ path }) => ({ path }));
const SentryRouteNames: React.FC = () => useSentryRoutes(SENTRY_ROUTES);

/** The page for the current URL (src/routes.ts), where the app shell puts its content. */
export const RoutesOutlet: React.FC = () => {
    markDashboardPath('routes_render');
    useDashboardPathMark('routes_commit');
    return (
        <ChunkBoundary>
            <Suspense
                fallback={
                    <FallbackMarker boundary="routes">
                        <DelayedFallback delayMs={200} onShow={markRoutesFallbackTimer}>
                            <RouteTransitionLoader />
                        </DelayedFallback>
                    </FallbackMarker>
                }
            >
                <GenericErrorBoundary>
                    <SentryRouteNames />
                    <Outlet />
                </GenericErrorBoundary>
            </Suspense>
        </ChunkBoundary>
    );
};
