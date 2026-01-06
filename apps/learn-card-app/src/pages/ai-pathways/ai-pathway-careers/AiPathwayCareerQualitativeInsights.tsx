import React from 'react';

import AiPathwayCareerGauge from './AiPathwayCareerGauge';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

export const AiPathwayCareerQualitativeInsights: React.FC<{ career: AiPathwayCareer }> = ({
    career,
}) => {
    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">Qualitative Insights</h2>
            </div>

            <div className="w-full flex items-center justify-start gap-4">
                <AiPathwayCareerGauge
                    title="Job Stability"
                    score={career?.qualitativeInsights.jobSecurityScore}
                />
                <AiPathwayCareerGauge
                    title="Work-Life Balance"
                    score={career?.qualitativeInsights.workLifeBalanceScore}
                />
            </div>
        </div>
    );
};

export default AiPathwayCareerQualitativeInsights;
