import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

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
 * Mounted at `/app-store/developer/*`, so route paths are relative to it.
 *
 * Route structure:
 * - /app-store/developer                                    -> MyAppsPage (every app, any project)
 * - /app-store/developer/apps/new?type=…                    -> SubmissionForm (list an existing app)
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
            <Routes>
                <Route index element={<MyAppsPage />} />
                <Route path="apps/new" element={<SubmissionForm />} />
                <Route path="apps/:listingId" element={<AppStatusPage />} />
                <Route path="build" element={<BuildHomePage />} />
                <Route
                    path="projects"
                    element={<Navigate replace to="/app-store/developer/build" />}
                />
                <Route
                    path="guides"
                    element={<Navigate replace to="/app-store/developer/build" />}
                />
                <Route path="submit" element={<SubmitFromManifestPage />} />

                {/* Apps routes with integration ID */}
                <Route
                    path="integrations/:integrationId/apps"
                    element={<Navigate replace to="/app-store/developer" />}
                />
                <Route path="integrations/:integrationId/apps/new" element={<SubmissionForm />} />
                <Route
                    path="integrations/:integrationId/apps/:listingId/listing"
                    element={<EditListingPage />}
                />
                <Route
                    path="integrations/:integrationId/apps/:listingId"
                    element={<SubmissionForm />}
                />

                {/* Legacy app routes - redirect to new structure */}
                <Route path="new" element={<Navigate replace to="/app-store/developer" />} />
                <Route
                    path="edit/:listingId"
                    element={<Navigate replace to="/app-store/developer" />}
                />

                {/* Legacy route */}
                <Route
                    path="partner-onboarding"
                    element={<Navigate replace to="/app-store/developer/guides" />}
                />

                <Route path="guides/:useCase" element={<GuidePage />} />

                <Route
                    path="integrations"
                    element={<Navigate replace to="/app-store/developer/build" />}
                />
                <Route path="integrations/:integrationId" element={<IntegrationDashboardPage />} />
                <Route path="integrations/:integrationId/guides" element={<IntegrationHub />} />
                <Route path="integrations/:integrationId/guides/:useCase" element={<GuidePage />} />
            </Routes>
        </DeveloperPortalProvider>
    );
};

export default DeveloperPortalRoutes;
