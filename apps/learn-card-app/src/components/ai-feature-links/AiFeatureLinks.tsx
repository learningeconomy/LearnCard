import React from 'react';
import { Link } from 'react-router-dom';

import { AiSessionsIconWithShape } from 'learn-card-base/svgs/wallet/AiSessionsIcon';
import { SkillsIconWithShape } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { AiPathwaysIconWithShape } from 'learn-card-base/svgs/wallet/AiPathwaysIcon';
import { AiInsightsIconWithShape } from 'learn-card-base/svgs/wallet/AiInsightsIcon';

type AiFeature = 'ai-sessions' | 'skills-hub' | 'pathways' | 'ai-insights';

const FEATURE_CONFIG: Record<AiFeature, { label: string; to: string; Icon: React.FC<{ className?: string }> }> = {
    'ai-sessions': { label: 'AI Sessions', to: '/ai/topics', Icon: AiSessionsIconWithShape },
    'skills-hub': { label: 'Skills Hub', to: '/skills', Icon: SkillsIconWithShape },
    'pathways': { label: 'Pathways', to: '/ai/pathways', Icon: AiPathwaysIconWithShape },
    'ai-insights': { label: 'AI Insights', to: '/ai/insights', Icon: AiInsightsIconWithShape },
};

interface AiFeatureLinksProps {
    features: AiFeature[];
    className?: string;
}

const AiFeatureLinks: React.FC<AiFeatureLinksProps> = ({ features, className = '' }) => {
    return (
        <div className={`w-full flex gap-3 ${className}`}>
            {features.map(feature => {
                const { label, to, Icon } = FEATURE_CONFIG[feature];
                return (
                    <Link
                        key={feature}
                        to={to}
                        className="flex-1 flex flex-col items-center justify-center gap-2 bg-white rounded-[16px] p-4 shadow-bottom-2-6"
                    >
                        <Icon className="w-[60px] h-[60px]" />
                        <span className="font-poppins font-semibold text-[14px] leading-[130%] text-grayscale-900 text-center">
                            {label}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
};

export default AiFeatureLinks;
