import React from 'react';

import { useTranslation } from 'react-i18next';

import AiPathwayCareerGauge from './AiPathwayCareerGauge';

import { type AiPathwayCareer } from './ai-pathway-careers.helpers';

export const AiPathwayCareerQualitativeInsights: React.FC<{ career: AiPathwayCareer }> = ({
    career,
}) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">Qualitative Insights</h2>
            </div>

            <div className="w-full flex items-center justify-start gap-4 my-2">
                <AiPathwayCareerGauge
                    title={t('aiPathways.jobStability', 'Job Stability')}
                    score={career?.qualitativeInsights.jobSecurityScore}
                />
                <AiPathwayCareerGauge
                    title={t('aiPathways.workLifeBalance', 'Work-Life Balance')}
                    score={career?.qualitativeInsights.workLifeBalanceScore}
                />
            </div>

            <div className="w-full flex items-center justify-center">
                <p className="text-xs text-grayscale-600 text-center">
                    *Based on the average score of user polling <br /> conducted for the{' '}
                    {career?.title} job.
                </p>
            </div>
        </div>
    );
};

export default AiPathwayCareerQualitativeInsights;
