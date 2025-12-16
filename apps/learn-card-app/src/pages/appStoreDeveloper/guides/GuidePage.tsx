import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { USE_CASES, UseCaseId } from './types';

import IssueCredentialsGuide from './useCases/IssueCredentialsGuide';
import EmbedClaimGuide from './useCases/EmbedClaimGuide';
import EmbedAppGuide from './useCases/EmbedAppGuide';
import ConsentFlowGuide from './useCases/ConsentFlowGuide';
import VerifyCredentialsGuide from './useCases/VerifyCredentialsGuide';
import ServerWebhooksGuide from './useCases/ServerWebhooksGuide';

const GUIDE_COMPONENTS: Record<UseCaseId, React.FC> = {
    'issue-credentials': IssueCredentialsGuide,
    'embed-claim': EmbedClaimGuide,
    'embed-app': EmbedAppGuide,
    'consent-flow': ConsentFlowGuide,
    'verify-credentials': VerifyCredentialsGuide,
    'server-webhooks': ServerWebhooksGuide,
};

const GuidePage: React.FC = () => {
    const { useCase } = useParams<{ useCase: string }>();
    const history = useHistory();

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
        <div className="flex items-center gap-2">
            <button
                onClick={() => history.push('/app-store/developer/guides')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Guides</span>
            </button>
        </div>
    );

    return (
        <IonPage>
            <AppStoreHeader title={useCaseConfig.title} rightContent={headerContent} />

            <IonContent className="ion-padding">
                <GuideComponent />
            </IonContent>
        </IonPage>
    );
};

export default GuidePage;
