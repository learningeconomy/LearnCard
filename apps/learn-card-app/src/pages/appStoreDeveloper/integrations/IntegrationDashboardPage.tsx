import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar } from '@ionic/react';
import {
    ArrowLeft,
    Loader2,
    Settings,
    ExternalLink,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import {
    CredentialTemplate,
    BrandingConfig,
    IntegrationMethod,
    DataMappingConfig,
    PartnerProject,
    TemplateBoostMeta,
} from '../partner-onboarding/types';
import { IntegrationDashboard } from '../partner-onboarding/dashboard';
import { useDeveloperPortal } from '../useDeveloperPortal';

interface RouteParams {
    integrationId: string;
}

const IntegrationDashboardPage: React.FC = () => {
    const history = useHistory();
    const { integrationId } = useParams<RouteParams>();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const { useIntegrations } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();

    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState<PartnerProject | null>(null);
    const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
    const [branding, setBranding] = useState<BrandingConfig | null>(null);
    const [integrationMethod, setIntegrationMethod] = useState<IntegrationMethod | null>(null);
    const [dataMapping, setDataMapping] = useState<DataMappingConfig | null>(null);

    // Find integration from list
    const integration = integrations?.find(i => i.id === integrationId);

    // Load integration data
    useEffect(() => {
        if (!integrationId) return;

        const loadIntegrationData = async () => {
            setIsLoading(true);

            try {
                const wallet = await initWalletRef.current();

                // Set project from integration
                if (integration) {
                    setProject({
                        id: integration.id,
                        name: integration.name,
                        createdAt: new Date().toISOString(),
                    });
                }

                // Fetch templates (boosts) for this integration
                const boostsResult = await wallet.invoke.getPaginatedBoosts({
                    limit: 100,
                    query: { meta: { integrationId } },
                });

                if (boostsResult?.records) {
                    const loadedTemplates: CredentialTemplate[] = boostsResult.records.map((boost: any) => {
                        const meta = boost.boost?.meta as TemplateBoostMeta | undefined;
                        const credential = boost.boost?.credential;

                        return {
                            id: boost.uri || boost.boost?.id || crypto.randomUUID(),
                            name: boost.boost?.name || credential?.name || 'Untitled Template',
                            description: credential?.credentialSubject?.achievement?.description || '',
                            achievementType: meta?.templateConfig?.achievementType || boost.boost?.type || 'Achievement',
                            fields: meta?.templateConfig?.fields || [],
                            imageUrl: boost.boost?.image || credential?.credentialSubject?.achievement?.image?.id,
                            boostUri: boost.uri,
                            isNew: false,
                            isDirty: false,
                        };
                    });

                    setTemplates(loadedTemplates);
                }

                // Load branding from profile
                try {
                    const profile = await wallet.invoke.getProfile();

                    if (profile) {
                        setBranding({
                            displayName: profile.displayName || '',
                            image: profile.image || '',
                            shortBio: profile.shortBio || '',
                            bio: profile.bio || '',
                            display: profile.display || {},
                        });
                    }
                } catch (err) {
                    console.warn('Could not load profile:', err);
                }

                // Load webhook config from integration if available
                if (integration?.webhookConfig) {
                    setIntegrationMethod('webhook');

                    setDataMapping({
                        webhookUrl: '', // Webhook URL is on our side, not theirs
                        mappings: integration.webhookConfig.mappings || [],
                    });
                }
            } catch (err) {
                console.error('Failed to load integration data:', err);

                presentToast('Failed to load integration', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadIntegrationData();
    }, [integrationId, integration, presentToast]);

    const handleBack = () => {
        history.push('/app-store/developer/integrations');
    };

    const handleGoToSetup = () => {
        history.push(`/app-store/developer/integrations/${integrationId}/setup`);
    };

    if (isLoading || isLoadingIntegrations) {
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

    if (!integration || !project) {
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
            <IonHeader className="ion-no-border">
                <IonToolbar className="!shadow-none border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3">
                                <img
                                    src={branding?.image || 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb'}
                                    alt={project.name}
                                    className="w-8 h-8 rounded-lg object-cover"
                                />

                                <span className="text-lg font-semibold text-gray-700">{project.name}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleGoToSetup}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Setup Wizard
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <IntegrationDashboard
                        project={project}
                        initialBranding={branding}
                        initialTemplates={templates}
                        initialIntegrationMethod={integrationMethod}
                        initialDataMapping={dataMapping}
                        onBack={handleBack}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationDashboardPage;
