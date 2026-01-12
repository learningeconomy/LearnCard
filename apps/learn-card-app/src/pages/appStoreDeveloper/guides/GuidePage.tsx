import React from 'react';
import { useParams, Redirect } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { USE_CASES, UseCaseId } from './types';

import IssueCredentialsGuide from './useCases/IssueCredentialsGuide';
import EmbedClaimGuide from './useCases/EmbedClaimGuide';
import EmbedAppGuide from './useCases/EmbedAppGuide';
import ConsentFlowGuide from './useCases/ConsentFlowGuide';
import VerifyCredentialsGuide from './useCases/VerifyCredentialsGuide';
import ServerWebhooksGuide from './useCases/ServerWebhooksGuide';
import CourseCatalogGuide from './useCases/CourseCatalogGuide';

// Guide components that accept integration prop
export interface GuideProps {
    selectedIntegration: LCNIntegration | null;
    setSelectedIntegration: (integration: LCNIntegration | null) => void;
}

const GUIDE_COMPONENTS: Record<UseCaseId, React.FC<GuideProps>> = {
    'issue-credentials': IssueCredentialsGuide,
    'embed-claim': EmbedClaimGuide,
    'embed-app': EmbedAppGuide,
    'consent-flow': ConsentFlowGuide,
    'verify-credentials': VerifyCredentialsGuide,
    'server-webhooks': ServerWebhooksGuide,
    'course-catalog': CourseCatalogGuide,
};

const GuidePage: React.FC = () => {
    const { useCase } = useParams<{ useCase: string }>();

    // Use context for all state management
    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
        goToIntegrationHub,
    } = useDeveloperPortalContext();

    // If no integration ID in URL, show a "select project" prompt instead of auto-selecting
    // (removed auto-redirect to first integration)

    // If integration is active, redirect to dashboard (shouldn't be on guides page)
    // Cast to string since server can return 'active' but type may not include it
    if (currentIntegration && (currentIntegration.status as string) === 'active') {
        return <Redirect to={`/app-store/developer/integrations/${currentIntegration.id}`} />;
    }

    // Show loader while waiting for integration to load (need to check if active)
    if (currentIntegrationId && isLoadingIntegrations) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" />

                <IonContent className="ion-padding">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading...</p>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Dummy setter for GuideProps - integration changes happen via navigation
    const handleSetSelectedIntegration = (_integration: LCNIntegration | null) => {
        // Integration changes happen via the selector, which triggers navigation
    };

    const useCaseId = useCase as UseCaseId;
    const useCaseConfig = USE_CASES[useCaseId];
    const GuideComponent = GUIDE_COMPONENTS[useCaseId];

    // If no integration selected, show a "select project" prompt
    if (!currentIntegrationId && !isLoadingIntegrations) {
        const headerContent = (
            <HeaderIntegrationSelector
                integrations={integrations}
                selectedId={null}
                onSelect={selectIntegration}
                isLoading={isLoadingIntegrations}
            />
        );

        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" rightContent={headerContent} />

                <IonContent className="ion-padding">
                    <div className="max-w-2xl mx-auto py-12 text-center">
                        <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ArrowLeft className="w-8 h-8 text-cyan-600" />
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Select a Project</h1>

                        <p className="text-gray-500 mb-6">
                            Choose a project from the dropdown above to continue with this guide.
                        </p>

                        {integrations.length === 0 && (
                            <p className="text-sm text-amber-600">
                                You don't have any projects yet. Create one from the dropdown above.
                            </p>
                        )}
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!useCaseConfig || !GuideComponent) {
        return (
            <IonPage>
                <AppStoreHeader title="Developer Portal" />

                <IonContent className="ion-padding">
                    <div className="max-w-2xl mx-auto py-12 text-center">
                        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Guide Not Found</h1>

                        <p className="text-gray-500 mb-6">
                            The guide you're looking for doesn't exist.
                        </p>

                        <button
                            onClick={goToIntegrationHub}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                        >
                            Back to Guides
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const isActive = (currentIntegration?.status as string) === 'active';

    const headerContent = (
        <div className="flex items-center gap-3">
            {!isActive && (
                <button
                    onClick={goToIntegrationHub}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">All Guides</span>
                </button>
            )}
            
            <HeaderIntegrationSelector
                integrations={integrations}
                selectedId={currentIntegrationId}
                onSelect={selectIntegration}
                isLoading={isLoadingIntegrations}
            />
        </div>
    );

    return (
        <IonPage>
            <AppStoreHeader title={useCaseConfig.title} rightContent={headerContent} />

            <IonContent className="ion-padding">
                <GuideComponent 
                    selectedIntegration={currentIntegration}
                    setSelectedIntegration={handleSetSelectedIntegration}
                />
            </IonContent>
        </IonPage>
    );
};

export default GuidePage;
