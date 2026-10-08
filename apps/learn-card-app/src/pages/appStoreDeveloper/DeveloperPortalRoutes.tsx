import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { DeveloperPortalProvider } from './DeveloperPortalContext';
import MyAppsPage from './apps/MyAppsPage';
import AppStatusPage from './apps/AppStatusPage';
import IntegrationHub from './guides/IntegrationHub';
import BuildHomePage from './build/BuildHomePage';
import GuidePage from './guides/GuidePage';
import IntegrationDashboardPage from './integrations/IntegrationDashboardPage';
import SubmissionForm from './SubmissionForm';

import { SubmitFromManifestPage, EditListingPage } from './submit';

/**
 * All developer portal routes wrapped in the context provider.
 * This ensures URL-based state is consistent across all pages.
 *
 * Route structure:
 * - /app-store/developer                                    -> MyAppsPage (every app, any project)
 * - /app-store/developer/apps/:listingId                   -> AppStatusPage (one app's status)
 * - /app-store/developer/build                              -> BuildHomePage (guides + projects)
 * - /app-store/developer/submit                             -> SubmitFromManifestPage (create from manifest)
 * - /app-store/developer/integrations/:id/apps              -> redirects to Your Apps
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
                <Route exact path="/app-store/developer" component={MyAppsPage} />
                <Route
                    exact
                    path="/app-store/developer/apps/:listingId"
                    component={AppStatusPage}
                />
                <Route exact path="/app-store/developer/build" component={BuildHomePage} />
                <Redirect
                    exact
                    from="/app-store/developer/projects"
                    to="/app-store/developer/build"
                />
                <Redirect
                    exact
                    from="/app-store/developer/guides"
                    to="/app-store/developer/build"
                />
                <Route
                    exact
                    path="/app-store/developer/submit"
                    component={SubmitFromManifestPage}
                />

                {/* Apps routes with integration ID */}
                <Redirect
                    exact
                    from="/app-store/developer/integrations/:integrationId/apps"
                    to="/app-store/developer"
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId/apps/new"
                    component={SubmissionForm}
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId/apps/:listingId/listing"
                    component={EditListingPage}
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId/apps/:listingId"
                    component={SubmissionForm}
                />

                {/* Legacy app routes - redirect to new structure */}
                <Redirect exact from="/app-store/developer/new" to="/app-store/developer" />
                <Redirect
                    exact
                    from="/app-store/developer/edit/:listingId"
                    to="/app-store/developer"
                />

                {/* Legacy route */}
                <Redirect
                    exact
                    from="/app-store/developer/partner-onboarding"
                    to="/app-store/developer/guides"
                />

                <Route exact path="/app-store/developer/guides/:useCase" component={GuidePage} />

                <Redirect
                    exact
                    from="/app-store/developer/integrations"
                    to="/app-store/developer/build"
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId"
                    component={IntegrationDashboardPage}
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId/guides"
                    component={IntegrationHub}
                />
                <Route
                    exact
                    path="/app-store/developer/integrations/:integrationId/guides/:useCase"
                    component={GuidePage}
                />
            </Switch>
        </DeveloperPortalProvider>
    );
};

export default DeveloperPortalRoutes;
