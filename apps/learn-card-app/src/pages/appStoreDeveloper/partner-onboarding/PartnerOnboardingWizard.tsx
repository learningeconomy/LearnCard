import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { Loader2, ArrowLeft } from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortal } from '../useDeveloperPortal';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import {
    Building2,
    Palette,
    FileStack,
    Plug,
    GitMerge,
    TestTube2,
    Rocket,
    Check,
    ChevronRight,
} from 'lucide-react';

import {
    PartnerOnboardingState,
    DEFAULT_ONBOARDING_STATE,
    ONBOARDING_STEPS,
    PartnerProject,
    BrandingConfig,
    CredentialTemplate,
    IntegrationMethod,
    DataMappingConfig,
} from './types';

import { ProjectSetupStep } from './steps/ProjectSetupStep';
import { BrandingStep } from './steps/BrandingStep';
import { TemplateBuilderStep } from './steps/TemplateBuilderStep';
import { IntegrationMethodStep } from './steps/IntegrationMethodStep';
import { DataMappingStep } from './steps/DataMappingStep';
import { SandboxTestStep } from './steps/SandboxTestStep';
import { ProductionStep } from './steps/ProductionStep';
import { IntegrationDashboard } from './dashboard';
import { usePersistedWizardState } from './hooks';
import { getIntegrationStatus, getIntegrationRoute, markIntegrationActive, updateSetupStep } from './utils/integrationStatus';

const STEP_ICONS = [Building2, Palette, FileStack, Plug, GitMerge, TestTube2, Rocket];

interface StepIndicatorProps {
    steps: typeof ONBOARDING_STEPS;
    currentStep: number;
    onStepClick: (index: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {steps.map((step, index) => {
                const Icon = STEP_ICONS[index];
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;
                const isClickable = index <= currentStep;

                return (
                    <React.Fragment key={step.id}>
                        <button
                            onClick={() => isClickable && onStepClick(index)}
                            disabled={!isClickable}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                                isCurrent
                                    ? 'bg-cyan-100 text-cyan-700 font-medium'
                                    : isComplete
                                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer'
                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                    isCurrent
                                        ? 'bg-cyan-500 text-white'
                                        : isComplete
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                {isComplete ? <Check className="w-3.5 h-3.5" /> : index + 1}
                            </div>

                            <span className="text-sm hidden sm:inline">{step.title}</span>

                            <Icon className="w-4 h-4 sm:hidden" />
                        </button>

                        {index < steps.length - 1 && (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

interface RouteParams {
    integrationId?: string;
}

const PartnerOnboardingWizard: React.FC = () => {
    const history = useHistory();
    const { integrationId } = useParams<RouteParams>();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const { useIntegrations } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();

    const [state, setState, { clear: clearPersistedState }] = usePersistedWizardState<PartnerOnboardingState>({
        key: integrationId ? `integration-${integrationId}` : 'partner-onboarding-new',
        initialState: DEFAULT_ONBOARDING_STATE,
    });
    const [isLoadingIntegration, setIsLoadingIntegration] = useState(!!integrationId);

    // Handle integration switching - navigate to correct state for that integration
    const handleIntegrationSelect = (id: string | null) => {
        if (id) {
            const route = getIntegrationRoute(id);
            history.push(route);
        }
    };

    // Load integration data when navigating directly to dashboard via URL
    useEffect(() => {
        if (!integrationId) return;

        const loadIntegration = async () => {
            setIsLoadingIntegration(true);

            try {
                const wallet = await initWalletRef.current();

                // Fetch boosts for this integration
                const boostsResult = await wallet.invoke.getPaginatedBoosts({
                    limit: 50,
                    query: { meta: { integrationId } },
                });

                const templates: CredentialTemplate[] = boostsResult?.records?.map((boost: any) => {
                    const meta = boost.boost?.meta as any;
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
                }) || [];

                // Load profile for branding
                let branding: BrandingConfig | null = null;
                try {
                    const profile = await wallet.invoke.getProfile();
                    if (profile) {
                        branding = {
                            displayName: profile.displayName || '',
                            image: profile.image || '',
                            shortBio: profile.shortBio || '',
                            bio: profile.bio || '',
                            display: profile.display || {},
                        };
                    }
                } catch (err) {
                    console.warn('Could not load profile:', err);
                }

                // Check integration status to determine if we should show wizard or dashboard
                const statusData = getIntegrationStatus(integrationId);
                const isActive = statusData.status === 'active';

                setState(prev => ({
                    ...prev,
                    project: { id: integrationId, name: `Integration ${integrationId.slice(0, 8)}`, createdAt: new Date().toISOString() },
                    templates,
                    branding,
                    isLive: isActive,
                    currentStep: isActive ? ONBOARDING_STEPS.length - 1 : (statusData.setupStep || 0),
                }));
            } catch (err) {
                console.error('Failed to load integration:', err);
                presentToast('Failed to load integration', { type: ToastTypeEnum.Error, hasDismissButton: true });
                history.push('/app-store/developer/guides');
            } finally {
                setIsLoadingIntegration(false);
            }
        };

        loadIntegration();
    }, [integrationId, history, presentToast]);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step <= state.currentStep) {
            setState(prev => ({ ...prev, currentStep: step }));
        }
    }, [state.currentStep]);

    const nextStep = useCallback(() => {
        setState(prev => {
            const newStep = Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1);

            // Track setup progress for this integration
            if (prev.project?.id) {
                updateSetupStep(prev.project.id, newStep);
            }

            return { ...prev, currentStep: newStep };
        });
    }, []);

    const prevStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 0),
        }));
    }, []);

    const handleProjectComplete = useCallback((project: PartnerProject) => {
        setState(prev => ({ ...prev, project }));
        nextStep();
    }, [nextStep]);

    const handleBrandingComplete = useCallback((branding: BrandingConfig) => {
        setState(prev => ({ ...prev, branding }));
        nextStep();
    }, [nextStep]);

    const handleTemplatesComplete = useCallback((templates: CredentialTemplate[]) => {
        setState(prev => ({ ...prev, templates }));
        nextStep();
    }, [nextStep]);

    const handleIntegrationMethodComplete = useCallback((method: IntegrationMethod) => {
        setState(prev => ({ ...prev, integrationMethod: method }));
        nextStep();
    }, [nextStep]);

    const handleDataMappingComplete = useCallback((mapping: DataMappingConfig, updatedTemplates: CredentialTemplate[]) => {
        setState(prev => ({ ...prev, dataMapping: mapping, templates: updatedTemplates }));
        nextStep();
    }, [nextStep]);

    const handleTestComplete = useCallback(() => {
        setState(prev => ({ ...prev, isTestMode: true }));
        nextStep();
    }, [nextStep]);

    const handleGoLive = useCallback(() => {
        setState(prev => ({ ...prev, isLive: true }));

        // Mark integration as active (setup complete)
        if (state.project?.id) {
            markIntegrationActive(state.project.id);

            // Redirect to the integration dashboard
            history.push(`/app-store/developer/integrations/${state.project.id}`);
        }
    }, [state.project?.id, history]);

    const handleBackToWizard = useCallback(() => {
        setState(prev => ({ ...prev, isLive: false }));
    }, []);

    const renderCurrentStep = () => {
        switch (state.currentStep) {
            case 0:
                return (
                    <ProjectSetupStep
                        project={state.project}
                        onComplete={handleProjectComplete}
                        onBack={prevStep}
                    />
                );

            case 1:
                return (
                    <BrandingStep
                        branding={state.branding}
                        onComplete={handleBrandingComplete}
                        onBack={prevStep}
                    />
                );

            case 2:
                return (
                    <TemplateBuilderStep
                        templates={state.templates}
                        branding={state.branding}
                        project={state.project}
                        onComplete={handleTemplatesComplete}
                        onBack={prevStep}
                    />
                );

            case 3:
                return (
                    <IntegrationMethodStep
                        selectedMethod={state.integrationMethod}
                        onComplete={handleIntegrationMethodComplete}
                        onBack={prevStep}
                    />
                );

            case 4:
                return (
                    <DataMappingStep
                        integrationMethod={state.integrationMethod!}
                        templates={state.templates}
                        project={state.project}
                        dataMapping={state.dataMapping}
                        onComplete={handleDataMappingComplete}
                        onBack={prevStep}
                    />
                );

            case 5:
                return (
                    <SandboxTestStep
                        project={state.project!}
                        branding={state.branding!}
                        templates={state.templates}
                        integrationMethod={state.integrationMethod!}
                        dataMapping={state.dataMapping!}
                        onComplete={handleTestComplete}
                        onBack={prevStep}
                    />
                );

            case 6:
                return (
                    <ProductionStep
                        project={state.project!}
                        isLive={state.isLive}
                        onGoLive={handleGoLive}
                        onBack={prevStep}
                    />
                );

            default:
                return null;
        }
    };

    const currentStepInfo = ONBOARDING_STEPS[state.currentStep];

    const headerContent = (
        <div className="flex items-center gap-3">
            <button
                onClick={() => {
                    const guidesPath = integrationId 
                        ? `/app-store/developer/integrations/${integrationId}/guides`
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
                selectedId={integrationId || null}
                onSelect={handleIntegrationSelect}
                isLoading={isLoadingIntegrations}
            />
        </div>
    );

    return (
        <IonPage>
            <AppStoreHeader title="Course Catalog Setup" rightContent={headerContent} />

            <IonContent>
                {isLoadingIntegration ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                            <p className="text-sm text-gray-500 mt-3">Loading integration...</p>
                        </div>
                    </div>
                ) : state.isLive && state.project ? (
                    <div className="max-w-5xl mx-auto px-4 py-6">
                        <IntegrationDashboard
                            project={state.project}
                            initialBranding={state.branding}
                            initialTemplates={state.templates}
                            initialIntegrationMethod={state.integrationMethod}
                            initialDataMapping={state.dataMapping}
                            onBack={handleBackToWizard}
                        />
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        {/* Step Indicator */}
                        <div className="mb-6">
                            <StepIndicator
                                steps={ONBOARDING_STEPS}
                                currentStep={state.currentStep}
                                onStepClick={goToStep}
                            />
                        </div>

                        {/* Step Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {currentStepInfo.title}
                            </h1>

                            <p className="text-gray-600">{currentStepInfo.description}</p>
                        </div>

                        {/* Step Content */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            {renderCurrentStep()}
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default PartnerOnboardingWizard;
