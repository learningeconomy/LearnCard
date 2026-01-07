import React from 'react';
import numeral from 'numeral';

import ArrowUp from 'learn-card-base/svgs/ArrowUp';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

export const AiPathwayCareerJobGrowthInfo: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">
                    Growth in the Job Market
                </h2>
            </div>

            <div className="w-full flex items-start justify-start gap-2">
                <span className="w-[20px] h-[20px]">
                    <ArrowUp className="text-grayscale-900 mt-1" />
                </span>
                <p className="text-grayscale-800 text-sm text-left">
                    In the last 5 years, there’s been a medium demand for {career?.title} in the
                    market with a total of {numeral(career.jobsCount).format('0,0')} new job
                    openings for this role.
                </p>
            </div>
        </div>
    );
};

export default AiPathwayCareerJobGrowthInfo;
