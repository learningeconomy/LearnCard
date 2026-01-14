import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Loader2 } from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { DashboardRouter } from '../dashboards';

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
            <IonPage>
                <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

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
                <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

                <IonContent className="ion-padding">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center justify-center min-h-[400px]">
                            <div className="text-center">
                                <p className="text-gray-500">Integration not found</p>
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    <DashboardRouter
                        integration={currentIntegration}
                        isLoading={false}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationPage;
