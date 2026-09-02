import React from 'react';
import * as m from '../../../paraglide/messages.js';
import { mDynamic } from '../../../i18n/mDynamic';
import {
    Layout,
    ExternalLink,
    Link,
    ShieldCheck,
    Server,
    CheckCircle2,
    Sparkles,
    Clock,
} from 'lucide-react';

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
    const handleSelect = (type: LaunchType, comingSoon?: boolean) => {
        if (comingSoon) return;
        onChange({ launch_type: type, launch_config_json: '' });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">
                    {m['developerPortal.components.launchTypeStep.title']()}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                    {m['developerPortal.components.launchTypeStep.description']()}
                </p>
            </div>

            <div className="grid gap-3">
                {(
                    Object.entries(LAUNCH_TYPE_INFO) as [
                        LaunchType,
                        (typeof LAUNCH_TYPE_INFO)[LaunchType]
                    ][]
                ).map(([type, info]) => {
                    const isSelected = data.launch_type === type;
                    const isComingSoon = info.comingSoon;
                    const IconComponent = ICON_MAP[info.icon];

                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleSelect(type, isComingSoon)}
                            disabled={isComingSoon}
                            className={`relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                                isComingSoon
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    : isSelected
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                        isComingSoon
                                            ? 'bg-gray-200 text-gray-400'
                                            : isSelected
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                    }`}
                                >
                                    {IconComponent && <IconComponent className="w-5 h-5" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3
                                            className={`font-semibold text-sm ${
                                                isComingSoon
                                                    ? 'text-gray-500'
                                                    : isSelected
                                                    ? 'text-cyan-700'
                                                    : 'text-gray-700'
                                            }`}
                                        >
                                            {mDynamic(info.labelKey)}
                                        </h3>

                                        {isComingSoon && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                <Clock className="w-3 h-3" />
                                                {m[
                                                    'developerPortal.components.launchTypeStep.comingSoon'
                                                ]()}
                                            </span>
                                        )}
                                    </div>

                                    <p
                                        className={`text-xs mt-0.5 ${
                                            isComingSoon ? 'text-gray-400' : 'text-gray-500'
                                        }`}
                                    >
                                        {mDynamic(info.descriptionKey)}
                                    </p>
                                </div>

                                {isSelected && !isComingSoon && (
                                    <CheckCircle2 className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Type-specific hints */}
            {data.launch_type && (
                <div className="p-4 bg-gray-100 rounded-xl">
                    <p className="text-sm text-gray-600">
                        {data.launch_type === 'EMBEDDED_IFRAME' &&
                            m['developerPortal.components.launchTypeStep.hintEmbeddedIframe']()}

                        {data.launch_type === 'SECOND_SCREEN' &&
                            m['developerPortal.components.launchTypeStep.hintSecondScreen']()}

                        {data.launch_type === 'DIRECT_LINK' &&
                            m['developerPortal.components.launchTypeStep.hintDirectLink']()}

                        {data.launch_type === 'CONSENT_REDIRECT' &&
                            m['developerPortal.components.launchTypeStep.hintConsentRedirect']()}

                        {data.launch_type === 'SERVER_HEADLESS' &&
                            m['developerPortal.components.launchTypeStep.hintServerHeadless']()}

                        {data.launch_type === 'AI_TUTOR' &&
                            m['developerPortal.components.launchTypeStep.hintAiTutor']()}
                    </p>
                </div>
            )}
        </div>
    );
};
