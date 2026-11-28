import React from 'react';
import { Loader2 } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { DashboardRouter } from '../dashboards';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';

/**
 * IntegrationPage - Main page for viewing/managing an integration.
 * Routes to the appropriate dashboard based on the integration's guideType and status.
 */
const IntegrationPage: React.FC = () => {
    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
    } = useDeveloperPortalContext();

    const integrationSelector = (
        <HeaderIntegrationSelector
            integrations={integrations}
            selectedId={currentIntegrationId}
            onSelect={selectIntegration}
            isLoading={isLoadingIntegrations}
        />
    );

    if (isLoadingIntegrations) {
        return (
            <AppPage>
                <AppStoreHeader
                    title={m['developerPortal.shell.title']()}
                    rightContent={integrationSelector}
                />

                <AppContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                                <p className="text-sm text-gray-500 mt-3">
                                    {m['developerPortal.shell.loadingIntegration']()}
                                </p>
                            </div>
                        </div>
                    </div>
                </AppContent>
            </AppPage>
        );
    }

    if (!currentIntegration) {
        return (
            <AppPage>
                <AppStoreHeader
                    title={m['developerPortal.shell.title']()}
                    rightContent={integrationSelector}
                />

                <AppContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <p className="text-gray-500">
                                    {m['developerPortal.shell.integrationNotFoundSimple']()}
                                </p>
                            </div>
                        </div>
                    </div>
                </AppContent>
            </AppPage>
        );
    }

    return (
        <AppPage>
            <AppStoreHeader
                title={m['developerPortal.shell.title']()}
                rightContent={integrationSelector}
            />

            <AppContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    <DashboardRouter integration={currentIntegration} isLoading={false} />
                </div>
            </AppContent>
        </AppPage>
    );
};

export default IntegrationPage;
