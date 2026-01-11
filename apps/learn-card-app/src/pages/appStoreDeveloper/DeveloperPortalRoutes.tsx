import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { DeveloperPortalProvider } from './DeveloperPortalContext';
import DeveloperPortal from './DeveloperPortal';
import IntegrationHub from './guides/IntegrationHub';
import GuidePage from './guides/GuidePage';
import IntegrationsList from './integrations/IntegrationsList';
import IntegrationDashboardPage from './integrations/IntegrationDashboardPage';
import SubmissionForm from './SubmissionForm';

/**
 * All developer portal routes wrapped in the context provider.
 * This ensures URL-based state is consistent across all pages.
 */
const DeveloperPortalRoutes: React.FC = () => {
    return (
        <DeveloperPortalProvider>
            <Switch>
                {/* Main developer portal - Apps tab */}
                <Route exact path="/app-store/developer" component={DeveloperPortal} />

                {/* App submission/editing */}
                <Route exact path="/app-store/developer/new" component={SubmissionForm} />
                <Route exact path="/app-store/developer/edit/:listingId" component={SubmissionForm} />

                {/* Guides without integration ID - redirect to first integration or show create prompt */}
                <Route exact path="/app-store/developer/guides" component={IntegrationHub} />
                <Route exact path="/app-store/developer/guides/:useCase" component={GuidePage} />

                {/* Legacy route */}
                <Redirect exact from="/app-store/developer/partner-onboarding" to="/app-store/developer/guides" />

                {/* Integration-specific routes */}
                <Route exact path="/app-store/developer/integrations" component={IntegrationsList} />
                <Route exact path="/app-store/developer/integrations/:integrationId" component={IntegrationDashboardPage} />
                <Route exact path="/app-store/developer/integrations/:integrationId/guides" component={IntegrationHub} />
                <Route exact path="/app-store/developer/integrations/:integrationId/guides/:useCase" component={GuidePage} />
            </Switch>
        </DeveloperPortalProvider>
    );
};

export default DeveloperPortalRoutes;
