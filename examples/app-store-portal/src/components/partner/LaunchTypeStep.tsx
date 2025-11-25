import React from 'react';
import {
    Layout,
    ExternalLink,
    Link,
    ShieldCheck,
    Server,
    CheckCircle2,
} from 'lucide-react';
import type { AppStoreListingCreate, LaunchType } from '../../types/app-store';
import { LAUNCH_TYPE_INFO } from '../../types/app-store';

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
};

export const LaunchTypeStep: React.FC<LaunchTypeStepProps> = ({ data, onChange }) => {
    const handleSelect = (type: LaunchType) => {
        onChange({ ...data, launch_type: type, launch_config_json: '' });
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="section-title">Launch Type</h2>

                <p className="section-subtitle mt-2">
                    Choose how your app will integrate with the LearnCard wallet
                </p>
            </div>

            <div className="grid gap-4">
                {(Object.entries(LAUNCH_TYPE_INFO) as [LaunchType, typeof LAUNCH_TYPE_INFO[LaunchType]][]).map(
                    ([type, info]) => {
                        const isSelected = data.launch_type === type;
                        const IconComponent = ICON_MAP[info.icon];

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleSelect(type)}
                                className={`relative w-full p-5 rounded-apple-lg border-2 text-left transition-all duration-200 group ${
                                    isSelected
                                        ? 'border-apple-blue bg-apple-blue/5'
                                        : 'border-apple-gray-200 hover:border-apple-gray-300 hover:bg-apple-gray-50'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-apple flex items-center justify-center transition-colors ${
                                            isSelected
                                                ? 'bg-apple-blue text-white'
                                                : 'bg-apple-gray-100 text-apple-gray-500 group-hover:bg-apple-gray-200'
                                        }`}
                                    >
                                        {IconComponent && <IconComponent className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1">
                                        <h3
                                            className={`font-semibold ${
                                                isSelected ? 'text-apple-blue' : 'text-apple-gray-600'
                                            }`}
                                        >
                                            {info.label}
                                        </h3>

                                        <p className="text-sm text-apple-gray-500 mt-1">
                                            {info.description}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <CheckCircle2 className="w-6 h-6 text-apple-blue flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        );
                    }
                )}
            </div>

            {/* Type-specific hints */}
            {data.launch_type && (
                <div className="p-4 bg-apple-gray-100 rounded-apple animate-fade-in">
                    <p className="text-sm text-apple-gray-500">
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
                    </p>
                </div>
            )}
        </div>
    );
};
