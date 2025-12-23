import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar } from '@ionic/react';
import {
    Building,
    Building2,
    Palette,
    FileStack,
    Plug,
    GitMerge,
    TestTube2,
    Rocket,
    ArrowLeft,
    Check,
    ChevronRight,
} from 'lucide-react';

import {
    PartnerOnboardingState,
    DEFAULT_ONBOARDING_STATE,
    ONBOARDING_STEPS,
    OrganizationProfile,
    PartnerProject,
    BrandingConfig,
    CredentialTemplate,
    IntegrationMethod,
    DataMappingConfig,
} from './types';

import { OrganizationSetupStep } from './steps/OrganizationSetupStep';
import { ProjectSetupStep } from './steps/ProjectSetupStep';
import { BrandingStep } from './steps/BrandingStep';
import { TemplateBuilderStep } from './steps/TemplateBuilderStep';
import { IntegrationMethodStep } from './steps/IntegrationMethodStep';
import { DataMappingStep } from './steps/DataMappingStep';
import { SandboxTestStep } from './steps/SandboxTestStep';
import { ProductionStep } from './steps/ProductionStep';

const STEP_ICONS = [Building, Building2, Palette, FileStack, Plug, GitMerge, TestTube2, Rocket];

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

const PartnerOnboardingWizard: React.FC = () => {
    const history = useHistory();
    const [state, setState] = useState<PartnerOnboardingState>(DEFAULT_ONBOARDING_STATE);

    const goToStep = useCallback((step: number) => {
        if (step >= 0 && step <= state.currentStep) {
            setState(prev => ({ ...prev, currentStep: step }));
        }
    }, [state.currentStep]);

    const nextStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.min(prev.currentStep + 1, ONBOARDING_STEPS.length - 1),
        }));
    }, []);

    const prevStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(prev.currentStep - 1, 0),
        }));
    }, []);

    const handleOrganizationComplete = useCallback((organization: OrganizationProfile) => {
        setState(prev => ({ ...prev, organization }));
        nextStep();
    }, [nextStep]);

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

    const handleDataMappingComplete = useCallback((mapping: DataMappingConfig) => {
        setState(prev => ({ ...prev, dataMapping: mapping }));
        nextStep();
    }, [nextStep]);

    const handleTestComplete = useCallback(() => {
        setState(prev => ({ ...prev, isTestMode: true }));
        nextStep();
    }, [nextStep]);

    const handleGoLive = useCallback(() => {
        setState(prev => ({ ...prev, isLive: true }));
    }, []);

    const renderCurrentStep = () => {
        switch (state.currentStep) {
            case 0:
                return (
                    <OrganizationSetupStep
                        organization={state.organization}
                        onComplete={handleOrganizationComplete}
                    />
                );

            case 1:
                return (
                    <ProjectSetupStep
                        project={state.project}
                        onComplete={handleProjectComplete}
                        onBack={prevStep}
                    />
                );

            case 2:
                return (
                    <BrandingStep
                        branding={state.branding}
                        onComplete={handleBrandingComplete}
                        onBack={prevStep}
                    />
                );

            case 3:
                return (
                    <TemplateBuilderStep
                        templates={state.templates}
                        branding={state.branding}
                        onComplete={handleTemplatesComplete}
                        onBack={prevStep}
                    />
                );

            case 4:
                return (
                    <IntegrationMethodStep
                        selectedMethod={state.integrationMethod}
                        onComplete={handleIntegrationMethodComplete}
                        onBack={prevStep}
                    />
                );

            case 5:
                return (
                    <DataMappingStep
                        integrationMethod={state.integrationMethod!}
                        templates={state.templates}
                        dataMapping={state.dataMapping}
                        onComplete={handleDataMappingComplete}
                        onBack={prevStep}
                    />
                );

            case 6:
                return (
                    <SandboxTestStep
                        project={state.project!}
                        branding={state.branding!}
                        templates={state.templates}
                        dataMapping={state.dataMapping!}
                        onComplete={handleTestComplete}
                        onBack={prevStep}
                    />
                );

            case 7:
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

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonToolbar className="!shadow-none border-b border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <button
                            onClick={() => history.push('/app-store/developer/guides')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <img
                                src="https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb"
                                alt="LearnCard"
                                className="w-8 h-8 rounded-lg"
                            />

                            <span className="text-lg font-semibold text-gray-700">Partner Onboarding</span>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent>
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
            </IonContent>
        </IonPage>
    );
};

export default PartnerOnboardingWizard;
