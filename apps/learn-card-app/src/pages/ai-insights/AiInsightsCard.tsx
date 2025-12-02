import React from 'react';
import { useHistory } from 'react-router-dom';

import SkillsInsightIcon from 'learn-card-base/svgs/SkillsInsightIcon';
import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';

import { useGetCredentialsForSkills } from 'learn-card-base';
import { mapBoostsToSkills } from '../skills/skills.helpers';

const AiInsightsCard: React.FC = () => {
    const history = useHistory();

    const handleExploreClick = () => {
        history.push('/skills');
    };

    const { data: allResolvedCreds } = useGetCredentialsForSkills();

    const skillsMap = mapBoostsToSkills(allResolvedCreds);

    // Calculate total count of skills and subskills
    const totalSkills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.length || 0),
        0
    );
    const totalSubskills = Object.values(skillsMap).reduce(
        (total, category) => total + (category?.totalSubskills || 0),
        0
    );

    const total = (totalSkills || 0) + (totalSubskills || 0);

    return (
        <div className="w-full flex items-center justify-center mt-4">
            <div className="w-full bg-indigo-600 rounded-[16px] flex items-center justify-between mb-4 relative shadow-bottom-2-4">
                <div className="flex flex-col items-start justify-center py-4 pl-4">
                    <h2 className="font-poppins font-semibold text-[20px] text-grayscale-50 text-left">
                        Skills
                    </h2>
                    <p className="font-poppins text-[14px] text-indigo-50 text-left my-2">
                        See the skills you've earned.
                    </p>

                    <div className="flex items-center text-white text-[20px] font-semibold">
                        <SkillsIcon className="h-[50px] w-[50px] mr-1" fill="white" />
                        {total}
                    </div>

                    <button
                        onClick={handleExploreClick}
                        className="rounded-full bg-white text-indigo-600 font-semibold px-6 py-2 mt-2 uppercase"
                    >
                        Explore
                    </button>
                </div>
                <div className="flex items-end justify-end">
                    <SkillsInsightIcon version="2" className="mt-[35px] mr-4" />
                </div>
            </div>
        </div>
    );
};

export default AiInsightsCard;
