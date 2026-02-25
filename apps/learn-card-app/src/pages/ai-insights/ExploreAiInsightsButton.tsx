import React from 'react';

import { Link } from 'react-router-dom';
import Vector from '../../components/svgs/Vector';
import { AiInsightsIcon } from 'learn-card-base/svgs/wallet/AiInsightsIcon';

export const ExploreAiInsightsButton: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`w-full max-w-[600px] flex items-center justify-center px-4 ${className}`}>
            <Link
                to="/ai/insights"
                className="w-full bg-indigo-600 text-white flex items-center gap-[11px] rounded-full pr-[25px] shadow-bottom-2-3 overflow-hidden relative"
            >
                <div className="relative">
                    <Vector color="lime-300" className="" />
                    <AiInsightsIcon className="h-[49px] w-[49px] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" />
                </div>
                <span className="text-[20px] font-poppins font-[600] leading-[130%]">
                    Explore AI Insights
                </span>
            </Link>
        </div>
    );
};

export default ExploreAiInsightsButton;
