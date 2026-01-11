import React from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Loader2 } from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { UnifiedIntegrationDashboard } from '../dashboards';

const IntegrationDashboardPage: React.FC = () => {
    const history = useHistory();

    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
    } = useDeveloperPortalContext();

    const handleBack = () => {
        history.push('/app-store/developer');
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
            <IonPage>
                <AppStoreHeader title="Developer Portal" rightContent={headerContent} />

                <IonContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                                <p className="text-sm text-gray-500 mt-3">Loading integration...</p>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!currentIntegration) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" rightContent={headerContent} />

                <IonContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center max-w-md">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    Integration Not Found
                                </h2>

                                <p className="text-gray-500 mb-6">
                                    The integration you're looking for doesn't exist or you don't have access to it.
                                </p>

                                <button
                                    onClick={handleBack}
                                    className="px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                                >
                                    Back to Apps
                                </button>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" rightContent={headerContent} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    <UnifiedIntegrationDashboard
                        integration={currentIntegration}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationDashboardPage;
