import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
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
    Lock,
} from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortalContext } from '../DeveloperPortalContext';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { USE_CASES, UseCaseId } from './types';
import { useBetaAccess } from '../components/BetaGate';
import * as m from '../../../paraglide/messages.js';
import { mDynamic } from '../../../i18n/mDynamic';
import { openExternalLink } from 'src/helpers/externalLinkHelpers';

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
    titleKey: string;
    subtitleKey: string;
    descriptionKey: string;
    icon: string;
    color: string;
    bgColor: string;
    comingSoon?: boolean;
    isActive?: boolean;
    isLocked?: boolean;
    onClick: () => void;
}

import { getLogger } from 'learn-card-base';
const log = getLogger('integration-hub');

const UseCaseCard: React.FC<UseCaseCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    color,
    bgColor,
    comingSoon,
    isActive,
    isLocked,
    onClick,
}) => {
    const IconComponent = ICON_MAP[icon] || Award;

    if (comingSoon) {
        return (
            <div className="flex flex-col p-6 bg-grayscale-50 border-2 border-dashed border-grayscale-200 rounded-2xl opacity-70">
                <div className="flex items-start justify-between mb-4">
                    <div
                        className={`w-12 h-12 bg-grayscale-100 rounded-xl flex items-center justify-center`}
                    >
                        <IconComponent className="w-6 h-6 text-grayscale-400" />
                    </div>

                    <span className="px-2 py-1 bg-grayscale-200 text-grayscale-600 rounded-full text-xs font-medium">
                        {m['developerPortal.guides.hub.comingSoon']()}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-grayscale-500 mb-1">{title}</h3>

                <p className="text-sm text-grayscale-400 mb-3">{subtitle}</p>

                <p className="text-sm text-grayscale-400 flex-1">{description}</p>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="flex flex-col p-6 bg-grayscale-50 border-2 border-grayscale-200 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-grayscale-100 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-grayscale-400" />
                    </div>

                    <span className="px-2 py-1 bg-grayscale-200 text-grayscale-500 rounded-full text-xs font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {m['developerPortal.guides.hub.locked']()}
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-grayscale-500 mb-1">{title}</h3>

                <p className="text-sm text-grayscale-400 mb-3">{subtitle}</p>

                <p className="text-sm text-grayscale-400 flex-1">{description}</p>

                <div className="flex items-center gap-1.5 mt-4 text-grayscale-400 font-medium text-sm">
                    <Lock className="w-4 h-4" />
                    <span>{m['developerPortal.guides.hub.requestAccess']()}</span>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            className={`group flex flex-col p-6 bg-white border-2 rounded-2xl hover:shadow-lg transition-all text-left ${
                isActive
                    ? 'border-emerald-500 shadow-lg shadow-emerald-50'
                    : 'border-grayscale-200 hover:border-emerald-300 hover:shadow-emerald-50'
            }`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
                    <IconComponent className={`w-6 h-6 ${color}`} />
                </div>

                {isActive && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                        {m['developerPortal.guides.hub.inProgress']()}
                    </span>
                )}
            </div>

            <h3 className="text-lg font-semibold text-grayscale-800 mb-1">{title}</h3>

            <p className="text-sm text-grayscale-500 mb-3">{subtitle}</p>

            <p className="text-sm text-grayscale-600 flex-1">{description}</p>

            <div className="flex items-center gap-1.5 mt-4 text-emerald-600 font-medium text-sm group-hover:gap-2.5 transition-all">
                <span>
                    {isActive
                        ? m['common.continue']()
                        : m['developerPortal.guides.hub.getStarted']()}
                </span>
                <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    );
};

const IntegrationHub: React.FC = () => {
    const history = useHistory();
    const { isGuideUnlocked } = useBetaAccess();

    const { createIntegration, isCreatingIntegration } = useDeveloperPortalContext();

    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();
    const { useCreateListing } = useDeveloperPortal();
    const createListingMutation = useCreateListing();

    const handleUseCaseClick = async (useCaseId: UseCaseId) => {
        try {
            const useCase = USE_CASES[useCaseId];
            const name = useCase.title || 'Untitled App';

            const id = await createIntegration(name);

            await updateIntegrationMutation.mutateAsync({
                id,
                updates: { guideType: useCaseId },
            });

            if (useCaseId === 'embed-app') {
                try {
                    await createListingMutation.mutateAsync({
                        integrationId: id,
                        listing: {
                            display_name: name,
                            tagline: `${name} - An embedded LearnCard app`,
                            full_description: `${name} is an embedded application that integrates with the LearnCard wallet.`,
                            icon_url: 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
                            launch_type: 'EMBEDDED_IFRAME',
                            launch_config_json: JSON.stringify({ url: '' }),
                        },
                    });
                } catch (e) {
                    log.error('Failed to auto-create listing:', e);
                }
            }

            history.push(`/app-store/developer/integrations/${id}/guides/${useCaseId}`);
        } catch (error) {
            log.error('Failed to create integration:', error);
        }
    };

    const useCaseList = Object.values(USE_CASES);

    return (
        <IonPage>
            <AppStoreHeader title={m['developerPortal.guides.page.title']()} />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span>{m['developerPortal.guides.hub.badge']()}</span>
                        </div>

                        <h1 className="text-3xl font-bold text-grayscale-800 mb-3">
                            What are you building?
                        </h1>

                        <p className="text-grayscale-500 max-w-lg mx-auto text-lg">
                            Select an app kind to get started.
                        </p>
                    </div>

                    {isCreatingIntegration ? (
                        <div className="flex items-center justify-center min-h-[200px]">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-emerald-500 mx-auto animate-spin" />
                                <p className="text-sm text-grayscale-500 mt-3">
                                    Creating your app...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {useCaseList.map(useCase => (
                                <UseCaseCard
                                    key={useCase.id}
                                    {...useCase}
                                    isLocked={!isGuideUnlocked(useCase.id)}
                                    onClick={() => handleUseCaseClick(useCase.id)}
                                />
                            ))}
                        </div>
                    )}

                    <div className="border-t border-grayscale-100 pt-10">
                        <h2 className="text-lg font-semibold text-grayscale-800 mb-4 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-grayscale-400" />
                            {m['developerPortal.guides.hub.resources.title']()}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => openExternalLink('https://docs.learncard.com')}
                                className="flex items-center gap-3 p-4 bg-grayscale-50 hover:bg-grayscale-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <BookOpen className="w-5 h-5 text-grayscale-600" />
                                </div>

                                <div className="flex-1 text-start">
                                    <p className="font-medium text-grayscale-800">
                                        {m[
                                            'developerPortal.guides.hub.resources.documentation.title'
                                        ]()}
                                    </p>
                                    <p className="text-sm text-grayscale-500">
                                        {m[
                                            'developerPortal.guides.hub.resources.documentation.description'
                                        ]()}
                                    </p>
                                </div>

                                <ExternalLink className="w-4 h-4 text-grayscale-400 group-hover:text-grayscale-600" />
                            </button>

                            <button
                                onClick={() =>
                                    openExternalLink('https://github.com/learningeconomy/LearnCard')
                                }
                                className="flex items-start gap-3 p-4 bg-grayscale-50 hover:bg-grayscale-100 rounded-xl transition-colors group"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <svg
                                        className="w-5 h-5 text-grayscale-600"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>

                                <div className="flex-1 text-start">
                                    <p className="font-medium text-grayscale-800">
                                        {m['developerPortal.guides.hub.resources.github.title']()}
                                    </p>
                                    <p className="text-sm text-grayscale-500">
                                        {m[
                                            'developerPortal.guides.hub.resources.github.description'
                                        ]()}
                                    </p>
                                </div>

                                <ExternalLink className="w-4 h-4 text-grayscale-400 group-hover:text-grayscale-600" />
                            </button>

                            <button
                                onClick={() => history.push('/app-store/developer')}
                                className="flex items-center gap-3 p-4 bg-grayscale-50 hover:bg-grayscale-100 rounded-xl transition-colors group text-left"
                            >
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    <Layout className="w-5 h-5 text-grayscale-600" />
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-grayscale-800">
                                        {m['developerPortal.guides.hub.resources.myApps.title']()}
                                    </p>
                                    <p className="text-sm text-grayscale-500">
                                        {m[
                                            'developerPortal.guides.hub.resources.myApps.description'
                                        ]()}
                                    </p>
                                </div>

                                <ArrowRight className="w-4 h-4 text-grayscale-400 group-hover:text-grayscale-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationHub;
