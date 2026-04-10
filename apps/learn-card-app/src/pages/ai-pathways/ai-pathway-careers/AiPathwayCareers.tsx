import React from 'react';

import AiPathwayCareerItem from './AiPathwayCareerItem';
import ExplorePathwaysModal from '../ExplorePathwaysModal';
import ExplorePathwaysActionButton from '../ExplorePathwaysActionButton';
import AiPathwayCareerItemSkeletonLoader from './AiPathwayCareerItemSkeletonLoader';

import useTheme from '../../../theme/hooks/useTheme';
import { ExperiencesIconWithShape } from 'learn-card-base/svgs/wallet/ExperiencesIcon';

import { CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';
import { AiPathwaysWhatWouldYouLikeToDoCardOptions } from '../ai-pathways-what-would-you-like-to-do/AiPathwaysWhatWouldYouLikeToDoCard';

const AiPathwayCareers: React.FC<{
    careerKeywords?: string[];
    occupations?: any[];
    isLoading?: boolean;
}> = ({ careerKeywords = [], occupations = [], isLoading = false }) => {
    const { newModal } = useModal();
    const { getThemedCategoryIcons } = useTheme();
    const { IconWithShape } = getThemedCategoryIcons(CredentialCategoryEnum.workHistory);
    const ResolvedIconWithShape = IconWithShape ?? ExperiencesIconWithShape;

    const handleExplorePathways = () => {
        newModal(
            <ExplorePathwaysModal option={AiPathwaysWhatWouldYouLikeToDoCardOptions.FindRoles} />,
            undefined,
            {
                desktop: ModalTypes.Right,
                mobile: ModalTypes.Right,
            }
        );
    };

    const titleEl = (
        <div className="w-full flex justify-start flex-col items-start gap-1">
            <h2 className="text-xl text-grayscale-800 font-notoSans font-semibold flex items-center gap-2">
                <ResolvedIconWithShape className="w-[50px] h-[50px]" /> Explore Roles
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

                <ExplorePathwaysActionButton
                    onClick={handleExplorePathways}
                    className="bg-cyan-501 !mt-4"
                    icon={
                        <ResolvedIconWithShape className="w-[30px] h-[30px]" />
                    }
                    label="Explore Roles"
                />
            </div>
        </div>
    );
};

export default AiPathwayCareers;
