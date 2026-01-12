import React, { useState } from 'react';
import { useHistory, Redirect } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { 
    Award, 
    Layout, 
    ShieldCheck, 
    CheckCircle, 
    Webhook,
    MousePointerClick,
    ArrowRight,
    Sparkles,
    BookOpen,
    ExternalLink,
    Rocket,
    Loader2,
} from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { HeaderIntegrationSelector } from '../components/HeaderIntegrationSelector';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { USE_CASES, UseCaseId } from './types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    'award': Award,
    'mouse-pointer-click': MousePointerClick,
    'layout': Layout,
    'shield-check': ShieldCheck,
    'check-circle': CheckCircle,
    'webhook': Webhook,
    'rocket': Rocket,
};

interface UseCaseCardProps {
    id: UseCaseId;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    comingSoon?: boolean;
    isActive?: boolean;
    onClick: () => void;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    color,
    bgColor,
    comingSoon,
    isActive,
    onClick,
}) => {
    const IconComponent = ICON_MAP[icon] || Award;

    if (comingSoon) {
        return (
            <div className="flex flex-col p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl opacity-70">
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-gray-400" />
                    </div>

                    <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                        Coming Soon
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-500 mb-1">{title}</h3>

                <p className="text-sm text-gray-400 mb-3">{subtitle}</p>

                <p className="text-sm text-gray-400 flex-1">{description}</p>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`group flex flex-col p-6 bg-white border-2 rounded-2xl hover:shadow-lg transition-all text-left ${
                isActive 
                    ? 'border-cyan-500 shadow-lg shadow-cyan-50' 
                    : 'border-gray-200 hover:border-cyan-300 hover:shadow-cyan-50'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${color}`} />
                </div>

                {isActive && (
                    <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                        In Progress
                    </span>
                )}
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>

            <p className="text-sm text-gray-500 mb-3">{subtitle}</p>

            <p className="text-sm text-gray-600 flex-1">{description}</p>

            <div className="flex items-center gap-1.5 mt-4 text-cyan-600 font-medium text-sm group-hover:gap-2.5 transition-all">
                <span>{isActive ? 'Continue' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    );
};

const IntegrationHub: React.FC = () => {
    const history = useHistory();
    const [newProjectName, setNewProjectName] = useState('');

    // Use context for all state management
    const {
        currentIntegrationId,
        currentIntegration,
        integrations,
        isLoadingIntegrations,
        selectIntegration,
        selectGuide,
        createIntegration,
        isCreatingIntegration,
    } = useDeveloperPortalContext();

    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();

    // No auto-redirect to first integration - let user select from dropdown

    const activeGuideType = currentIntegration?.guideType || null;

    const handleUseCaseClick = async (useCaseId: UseCaseId) => {
        if (!currentIntegrationId) return;

        try {
            // Save the guide type on the server
            await updateIntegrationMutation.mutateAsync({
                id: currentIntegrationId,
                updates: { guideType: useCaseId },
            });
        } catch (error) {
            console.error('Failed to save guide selection:', error);
        }

        // Navigate to guide
        selectGuide(useCaseId);
    };

    const handleCreateFirstProject = async () => {
        if (!newProjectName.trim()) return;

        try {
            await createIntegration(newProjectName.trim());
            setNewProjectName('');
        } catch (error) {
            console.error('Failed to create project:', error);
        }
    };

    const useCaseList = Object.values(USE_CASES);
    const hasIntegration = currentIntegrationId !== null;
    const showSetupPrompt = !isLoadingIntegrations && integrations.length === 0;

    const integrationSelector = (
        <HeaderIntegrationSelector
            integrations={integrations}
            selectedId={currentIntegrationId}
            onSelect={selectIntegration}
            isLoading={isLoadingIntegrations}
        />
    );

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" rightContent={integrationSelector} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    {/* Setup prompt when no integrations exist */}
                    {showSetupPrompt && (
                        <div className="max-w-lg mx-auto py-12">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-cyan-200">
                                    <Rocket className="w-8 h-8 text-white" />
                                </div>

                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                    Create Your First Project
                                </h2>

                                <p className="text-gray-500">
                                    Set up a project to start building your integration.
                                </p>
                            </div>

                            <div className="max-w-md mx-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    Name your project
                                </label>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateFirstProject()}
                                        placeholder="e.g. My Awesome App"
                                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 shadow-sm"
                                        disabled={isCreatingIntegration}
                                    />

                                    <button
                                        onClick={handleCreateFirstProject}
                                        disabled={!newProjectName.trim() || isCreatingIntegration}
                                        className="px-5 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-200 flex items-center gap-2"
                                    >
                                        {isCreatingIntegration ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Create
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Select project prompt when integrations exist but none selected */}
                    {!hasIntegration && !showSetupPrompt && (
                        <div className="max-w-2xl mx-auto py-12">
                            {/* Hero section */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium mb-4">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Integration Guides</span>
                                </div>

                                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                                    Build Your Integration
                                </h1>

                                <p className="text-gray-500 max-w-lg mx-auto text-lg">
                                    Select a project from the dropdown above to get started, or browse the available guides below.
                                </p>
                            </div>

                            {/* Guide preview cards - clickable but prompt to select project */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {useCaseList.slice(0, 4).map(useCase => {
                                    const IconComponent = ICON_MAP[useCase.icon] || Award;

                                    return (
                                        <div
                                            key={useCase.id}
                                            className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl"
                                        >
                                            <div className={`w-10 h-10 ${useCase.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                <IconComponent className={`w-5 h-5 ${useCase.color}`} />
                                            </div>

                                            <div>
                                                <h3 className="font-medium text-gray-800">{useCase.title}</h3>
                                                <p className="text-sm text-gray-500">{useCase.subtitle}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-center text-sm text-gray-500">
                                Select a project above to access all {useCaseList.length} guides
                            </p>
                        </div>
                    )}

                    {/* Main content when integration is selected */}
                    {hasIntegration && (
                        <>
                            {/* Hero section */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-sm font-medium mb-4">
                                    <Sparkles className="w-4 h-4" />
                                    <span>Integration Guides</span>
                                </div>

                                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                                    Build Your Integration
                                </h1>

                                <p className="text-gray-500 max-w-lg mx-auto text-lg">
                                    Choose what you want to build. We'll guide you through each step with 
                                    ready-to-use code and live setup tools.
                                </p>
                            </div>

                            {/* Use case grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                                {useCaseList.map(useCase => (
                                    <UseCaseCard
                                        key={useCase.id}
                                        {...useCase}
                                        isActive={activeGuideType === useCase.id}
                                        onClick={() => handleUseCaseClick(useCase.id)}
                                    />
                                ))}
                            </div>

                        </>
                    )}

                    {/* Resources section - always show when not in setup */}
                    {!showSetupPrompt && (
                    <div className="border-t border-gray-100 pt-10">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-gray-400" />
                            Additional Resources
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a
                                href="https://docs.learncard.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <BookOpen className="w-5 h-5 text-gray-600" />
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Documentation</p>
                                    <p className="text-sm text-gray-500">Full API reference</p>
                                </div>

                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </a>

                            <a
                                href="https://github.com/learningeconomy/LearnCard"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                    </svg>
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">GitHub</p>
                                    <p className="text-sm text-gray-500">Open source SDKs</p>
                                </div>

                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </a>

                            <button
                                onClick={() => history.push('/app-store/developer')}
                                className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group text-left"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <Layout className="w-5 h-5 text-gray-600" />
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">My Apps</p>
                                    <p className="text-sm text-gray-500">Manage listings</p>
                                </div>

                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            </button>
                        </div>
                    </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationHub;
