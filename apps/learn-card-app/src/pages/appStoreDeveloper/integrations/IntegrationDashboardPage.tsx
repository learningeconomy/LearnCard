import React from 'react';
import { useNavigate } from 'react-router';
import { Loader2, ArrowLeft, Plus } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { UnifiedIntegrationDashboard } from '../dashboards';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';

const IntegrationDashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
    } = useDeveloperPortalContext();

    const handleBack = () => {
        navigate('/app-store/developer/build');
    };

    const headerContent = (
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
                    rightContent={headerContent}
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
                    rightContent={headerContent}
                />

                <AppContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center max-w-md">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    {m['developerPortal.shell.integrationNotFound']()}
                                </h2>

                                <p className="text-gray-500 mb-6">
                                    {m['developerPortal.shell.integrationNotFoundDescription']()}
                                </p>

                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                                >
                                    {m['developerPortal.shell.backToApps']()}
                                </button>
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
                rightContent={headerContent}
            />

            <AppContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {m['developerPortal.shell.backToProjects']()}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/app-store/developer/integrations/${currentIntegration.id}/apps/new`
                                )
                            }
                            className="flex items-center gap-1.5 py-2 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Store Listing
                        </button>
                    </div>

                    <UnifiedIntegrationDashboard integration={currentIntegration} />
                </div>
            </AppContent>
        </AppPage>
    );
};

export default IntegrationDashboardPage;
