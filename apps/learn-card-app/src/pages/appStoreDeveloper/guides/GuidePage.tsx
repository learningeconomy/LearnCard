import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { USE_CASES, UseCaseId } from './types';
import { getIntegrationRoute } from '../partner-onboarding/utils/integrationStatus';

import IssueCredentialsGuide from './useCases/IssueCredentialsGuide';
import EmbedClaimGuide from './useCases/EmbedClaimGuide';
import EmbedAppGuide from './useCases/EmbedAppGuide';
import ConsentFlowGuide from './useCases/ConsentFlowGuide';
import VerifyCredentialsGuide from './useCases/VerifyCredentialsGuide';
import ServerWebhooksGuide from './useCases/ServerWebhooksGuide';

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
};

const GuidePage: React.FC = () => {
    const { useCase, integrationId } = useParams<{ useCase: string; integrationId?: string }>();
    const history = useHistory();
    const location = useLocation();
    
    // Support both route param and query param for backward compatibility
    const searchParams = new URLSearchParams(location.search);
    const queryIntegrationId = searchParams.get('integrationId');
    const urlIntegrationId = integrationId || queryIntegrationId;
    
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(urlIntegrationId);
    const [selectedIntegration, setSelectedIntegration] = useState<LCNIntegration | null>(null);
    
    const { useIntegrations } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
    
    // Set integration from URL param or default to first
    useEffect(() => {
        if (integrations && integrations.length > 0) {
            if (urlIntegrationId) {
                const found = integrations.find(i => i.id === urlIntegrationId);
                if (found) {
                    setSelectedIntegration(found);
                    setSelectedIntegrationId(found.id);
                    return;
                }
            }
            // Default to first if URL param not found
            if (!selectedIntegrationId) {
                setSelectedIntegration(integrations[0]);
                setSelectedIntegrationId(integrations[0].id);
            }
        }
    }, [integrations, urlIntegrationId, selectedIntegrationId]);
    
    // Update selected integration when ID changes
    useEffect(() => {
        if (integrations && selectedIntegrationId) {
            const found = integrations.find(i => i.id === selectedIntegrationId);
            if (found) {
                setSelectedIntegration(found);
            }
        }
    }, [selectedIntegrationId, integrations]);
    
    const handleSetSelectedIntegration = (integration: LCNIntegration | null) => {
        setSelectedIntegration(integration);
        setSelectedIntegrationId(integration?.id || null);
    };

    // When switching integrations, navigate to that integration's correct state/guide
    const handleIntegrationSelect = (id: string | null) => {
        setSelectedIntegrationId(id);

        if (id && integrations) {
            const found = integrations.find(i => i.id === id);
            if (found) {
                setSelectedIntegration(found);

                // Navigate to the correct route for this integration's state
                const route = getIntegrationRoute(found);
                history.push(route);
            }
        }
    };

    const useCaseId = useCase as UseCaseId;
    const useCaseConfig = USE_CASES[useCaseId];
    const GuideComponent = GUIDE_COMPONENTS[useCaseId];

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
                            onClick={() => history.push('/app-store/developer/guides')}
                            className="px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                        >
                            Back to Guides
                        </button>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const headerContent = (
        <div className="flex items-center gap-3">
            <button
                onClick={() => {
                    const guidesPath = selectedIntegrationId 
                        ? `/app-store/developer/integrations/${selectedIntegrationId}/guides`
                        : '/app-store/developer/guides';
                    history.push(guidesPath);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Guides</span>
            </button>
            
            <HeaderIntegrationSelector
                integrations={integrations || []}
                selectedId={selectedIntegrationId}
                onSelect={handleIntegrationSelect}
                isLoading={isLoadingIntegrations}
            />
        </div>
    );

    return (
        <IonPage>
            <AppStoreHeader title={useCaseConfig.title} rightContent={headerContent} />

            <IonContent className="ion-padding">
                <GuideComponent 
                    selectedIntegration={selectedIntegration}
                    setSelectedIntegration={handleSetSelectedIntegration}
                />
            </IonContent>
        </IonPage>
    );
};

export default GuidePage;
