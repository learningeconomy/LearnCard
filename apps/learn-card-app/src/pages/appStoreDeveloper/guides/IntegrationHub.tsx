import React from 'react';
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
} from 'lucide-react';

import { AppStoreHeader } from '../components/AppStoreHeader';
import { USE_CASES, UseCaseId } from './types';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    'award': Award,
    'mouse-pointer-click': MousePointerClick,
    'layout': Layout,
    'shield-check': ShieldCheck,
    'check-circle': CheckCircle,
    'webhook': Webhook,
};

interface UseCaseCardProps {
    id: UseCaseId;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    bgColor: string;
    onClick: () => void;
}

const UseCaseCard: React.FC<UseCaseCardProps> = ({
    title,
    subtitle,
    description,
    icon,
    color,
    bgColor,
    onClick,
}) => {
    const IconComponent = ICON_MAP[icon] || Award;

    return (
        <button
            onClick={onClick}
            className="group flex flex-col p-6 bg-white border border-gray-200 rounded-2xl hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-50 transition-all text-left"
        >
            <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <IconComponent className={`w-6 h-6 ${color}`} />
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>

            <p className="text-sm text-gray-500 mb-3">{subtitle}</p>

            <p className="text-sm text-gray-600 flex-1">{description}</p>

            <div className="flex items-center gap-1.5 mt-4 text-cyan-600 font-medium text-sm group-hover:gap-2.5 transition-all">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    );
};

const IntegrationHub: React.FC = () => {
    const history = useHistory();

    const handleUseCaseClick = (useCaseId: UseCaseId) => {
        history.push(`/app-store/developer/guides/${useCaseId}`);
    };

    const useCaseList = Object.values(USE_CASES);

    return (
        <IonPage>
            <AppStoreHeader title="Developer Portal" />

            <IonContent className="ion-padding">
                <div className="max-w-5xl mx-auto py-4">
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
                                onClick={() => handleUseCaseClick(useCase.id)}
                            />
                        ))}
                    </div>

                    {/* Resources section */}
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
                </div>
            </IonContent>
        </IonPage>
    );
};

export default IntegrationHub;
