import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar } from '@ionic/react';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { useDeveloperPortal } from '../useDeveloperPortal';
import { UnifiedIntegrationDashboard } from '../dashboards';

interface RouteParams {
    integrationId: string;
}

const IntegrationDashboardPage: React.FC = () => {
    const history = useHistory();
    const { integrationId } = useParams<RouteParams>();

    const { useIntegrations } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();

    const integration = integrations?.find(i => i.id === integrationId);

    const handleBack = () => {
        history.push('/app-store/developer/integrations');
    };

    if (isLoadingIntegrations) {
        return (
            <IonPage>
                <IonHeader className="ion-no-border">
                    <IonToolbar className="!shadow-none border-b border-gray-200">
                        <div className="flex items-center gap-3 px-4 py-2">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <span className="text-lg font-semibold text-gray-700">Loading...</span>
                        </div>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading integration...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!integration) {
        return (
            <IonPage>
                <IonHeader className="ion-no-border">
                    <IonToolbar className="!shadow-none border-b border-gray-200">
                        <div className="flex items-center gap-3 px-4 py-2">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <span className="text-lg font-semibold text-gray-700">Integration Not Found</span>
                        </div>
                    </IonToolbar>
                </IonHeader>

                <IonContent>
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
                                Back to Integrations
                            </button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage>
            <IonContent>
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <UnifiedIntegrationDashboard
                        integration={integration}
                        onBack={handleBack}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationDashboardPage;
