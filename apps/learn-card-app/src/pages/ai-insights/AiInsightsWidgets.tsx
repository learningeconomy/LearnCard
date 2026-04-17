import React from 'react';
import { useVerifiableData } from 'learn-card-base';
import {
    SKILL_PROFILE_PROFILE_KEY,
    SkillProfileProfileData,
} from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep1';
import { useOccupationForProfessionalTitle } from './useOccupationForProfessionalTitle';
import AiInsightsAverageSalaryBox from './AiInsightsAverageSalaryBox';
import AiPathwayTopPayLocations from '../ai-pathways/ai-pathway-careers/AiPathwayTopPayLocations';
import AiPathwayCareerJobGrowthInfo from '../ai-pathways/ai-pathway-careers/AiPathwayCareersJobGrowthInfo';

type AiInsightsWidgetsProps = {};

const AiInsightsWidgets: React.FC<AiInsightsWidgetsProps> = ({}) => {
    const { data: profileData } = useVerifiableData<SkillProfileProfileData>(
        SKILL_PROFILE_PROFILE_KEY,
        {
            name: 'Professional Profile',
            description: 'Professional title and experience level',
        }
    );

    const professionalTitle = profileData?.professionalTitle || '';
    const {
        occupation,
        occupations,
        isLoading: occupationLoading,
    } = useOccupationForProfessionalTitle(professionalTitle);

    const hasOccupationData = occupations.length > 0 && Boolean(occupation);

    return (
        <React.Fragment>
            <div className="flex flex-col gap-[30px] bg-white rounded-[15px] py-[25px] px-[15px] w-full max-w-[600px] shadow-bottom-4-4">
                {occupationLoading ? (
                    <div className="py-2">
                        <p className="text-sm text-grayscale-600">Finding career data...</p>
                    </div>
                ) : hasOccupationData && occupation ? (
                    <>
                        {occupation.Projections?.Projections?.[0] && (
                            <AiPathwayCareerJobGrowthInfo occupation={occupation} compact />
                        )}

                        {occupation.Projections?.Projections?.[0] && (
                            <div className="h-[1px] w-full bg-grayscale-200" />
                        )}

                        <AiPathwayTopPayLocations occupation={occupation} compact />
                    </>
                ) : (
                    <div className="py-2">
                        <p className="text-sm text-grayscale-600 leading-relaxed">
                            {professionalTitle
                                ? 'We could not find career data for this title yet.'
                                : 'Add a professional title to see career data here.'}
                        </p>
                    </div>
                )}
            </div>

            <AiInsightsAverageSalaryBox
                professionalTitle={professionalTitle}
                occupation={occupation}
                isLoading={occupationLoading}
            />
        </React.Fragment>
    );
};

export default AiInsightsWidgets;
