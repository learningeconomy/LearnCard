import React from 'react';

import AiPathwayCareerItem from './AiPathwayCareerItem';
import AiPathwayCareerItemSkeletonLoader from './AiPathwayCareerItemSkeletonLoader';

import useTheme from '../../../theme/hooks/useTheme';

import { CredentialCategoryEnum } from 'learn-card-base';

const AiPathwayCareers: React.FC<{
    careerKeywords?: string[];
    occupations?: any[];
    isLoading?: boolean;
}> = ({ careerKeywords = [], occupations = [], isLoading = false }) => {
    const { getThemedCategoryIcons } = useTheme();
    const { IconWithShape } = getThemedCategoryIcons(CredentialCategoryEnum.workHistory);

    const titleEl = (
        <div className="w-full flex justify-start flex-col items-start gap-1">
            <h2 className="text-xl text-grayscale-800 font-notoSans font-semibold flex items-center gap-2">
                {IconWithShape && <IconWithShape className="w-[50px] h-[50px]" />} Explore Roles
            </h2>
            <p className="text-sm text-grayscale-600 font-notoSans">
                Use your current skills to start new opportunities.
            </p>
        </div>
    );

    if (isLoading) {
        return (
            <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
                <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                    {titleEl}

                    <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <AiPathwayCareerItemSkeletonLoader key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoading && (!careerKeywords?.length || !occupations?.length)) return null;

    return (
        <div className="w-full max-w-[600px] flex items-center justify-center flex-wrap text-center px-4">
            <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px]">
                {titleEl}

                <div className="w-full flex flex-col items-start justify-start mt-4 gap-4">
                    {occupations?.map(occupation => (
                        <AiPathwayCareerItem key={occupation.OnetCode} occupation={occupation} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AiPathwayCareers;
