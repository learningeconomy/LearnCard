import React from 'react';
import { Layout, ExternalLink, Link, ShieldCheck, Server, CheckCircle2, Sparkles } from 'lucide-react';

import type { AppStoreListingCreate, LaunchType } from '../types';
import { LAUNCH_TYPE_INFO } from '../types';

interface LaunchTypeStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    layout: Layout,
    'external-link': ExternalLink,
    link: Link,
    'shield-check': ShieldCheck,
    server: Server,
    sparkles: Sparkles,
};

export const LaunchTypeStep: React.FC<LaunchTypeStepProps> = ({ data, onChange }) => {
    const handleSelect = (type: LaunchType) => {
        onChange({ ...data, launch_type: type, launch_config_json: '' });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Launch Type</h2>

                <p className="text-sm text-gray-500 mt-1">
                    Choose how your app will integrate with the LearnCard wallet
                </p>
            </div>

            <div className="grid gap-3">
                {(Object.entries(LAUNCH_TYPE_INFO) as [LaunchType, typeof LAUNCH_TYPE_INFO[LaunchType]][]).map(
                    ([type, info]) => {
                        const isSelected = data.launch_type === type;
                        const IconComponent = ICON_MAP[info.icon];

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleSelect(type)}
                                className={`relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                                    isSelected
                                        ? 'border-cyan-500 bg-cyan-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                        }`}
                                    >
                                        {IconComponent && <IconComponent className="w-5 h-5" />}
                                    </div>

                                    <div className="flex-1">
                                        <h3
                                            className={`font-semibold text-sm ${
                                                isSelected ? 'text-cyan-700' : 'text-gray-700'
                                            }`}
                                        >
                                            {info.label}
                                        </h3>

                                        <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                                    </div>

                                    {isSelected && (
                                        <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        );
                    }
                )}
            </div>

            {/* Type-specific hints */}
            {data.launch_type && (
                <div className="p-4 bg-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600">
                        {data.launch_type === 'EMBEDDED_IFRAME' &&
                            "You'll need to configure iframe dimensions and security settings in the next step."}

                        {data.launch_type === 'SECOND_SCREEN' &&
                            "You'll provide the URL that opens in a new window alongside the wallet."}

                        {data.launch_type === 'DIRECT_LINK' &&
                            "You'll provide a simple redirect URL for your application."}

                        {data.launch_type === 'CONSENT_REDIRECT' &&
                            "You'll configure the consent flow contract URI and callback URL."}

                        {data.launch_type === 'SERVER_HEADLESS' &&
                            "You'll configure webhook endpoints for server-to-server integration."}

                        {data.launch_type === 'AI_TUTOR' &&
                            "You'll provide your AI tutor URL. Users will select a topic and launch to your app with their DID and topic."}
                    </p>
                </div>
            )}
        </div>
    );
};
