import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { DeveloperPortalProvider } from './DeveloperPortalContext';
import DeveloperPortal from './DeveloperPortal';
import AppsLandingPage from './AppsLandingPage';
import IntegrationHub from './guides/IntegrationHub';
import GuidePage from './guides/GuidePage';
import IntegrationsList from './integrations/IntegrationsList';
import IntegrationDashboardPage from './integrations/IntegrationDashboardPage';
import SubmissionForm from './SubmissionForm';

/**
 * All developer portal routes wrapped in the context provider.
 * This ensures URL-based state is consistent across all pages.
 * 
 * Route structure:
 * - /app-store/developer                                    -> AppsLandingPage (select integration)
 * - /app-store/developer/integrations/:id/apps              -> DeveloperPortal (apps for integration)
 * - /app-store/developer/integrations/:id/apps/new          -> SubmissionForm (create app)
 * - /app-store/developer/integrations/:id/apps/:listingId   -> SubmissionForm (edit app)
 * - /app-store/developer/integrations/:id                   -> IntegrationDashboardPage (Build dashboard)
 * - /app-store/developer/integrations/:id/guides            -> IntegrationHub (select guide)
 * - /app-store/developer/integrations/:id/guides/:useCase   -> GuidePage (specific guide)
 */
const DeveloperPortalRoutes: React.FC = () => {
    return (
        <DeveloperPortalProvider>
            <Switch>
                {/* Apps Landing - no integration selected */}
                <Route exact path="/app-store/developer" component={AppsLandingPage} />

                {/* Apps routes with integration ID */}
                <Route exact path="/app-store/developer/integrations/:integrationId/apps" component={DeveloperPortal} />
                <Route exact path="/app-store/developer/integrations/:integrationId/apps/new" component={SubmissionForm} />
                <Route exact path="/app-store/developer/integrations/:integrationId/apps/:listingId" component={SubmissionForm} />

                {/* Legacy app routes - redirect to new structure */}
                <Redirect exact from="/app-store/developer/new" to="/app-store/developer" />
                <Redirect exact from="/app-store/developer/edit/:listingId" to="/app-store/developer" />

                {/* Guides without integration ID - show select project prompt */}
                <Route exact path="/app-store/developer/guides" component={IntegrationHub} />
                <Route exact path="/app-store/developer/guides/:useCase" component={GuidePage} />

                {/* Legacy route */}
                <Redirect exact from="/app-store/developer/partner-onboarding" to="/app-store/developer/guides" />

                {/* Integration-specific routes (Build side) */}
                <Route exact path="/app-store/developer/integrations" component={IntegrationsList} />
                <Route exact path="/app-store/developer/integrations/:integrationId" component={IntegrationDashboardPage} />
                <Route exact path="/app-store/developer/integrations/:integrationId/guides" component={IntegrationHub} />
                <Route exact path="/app-store/developer/integrations/:integrationId/guides/:useCase" component={GuidePage} />
            </Switch>
        </DeveloperPortalProvider>
    );
};

export default DeveloperPortalRoutes;
