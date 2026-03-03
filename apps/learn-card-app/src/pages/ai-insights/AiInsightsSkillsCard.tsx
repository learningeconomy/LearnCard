import React from 'react';
import { useHistory } from 'react-router-dom';

import SkillsInsightIcon from 'learn-card-base/svgs/SkillsInsightIcon';
import SkillsIcon from 'learn-card-base/svgs/wallet/SkillsIcon';

import { useSkillsCount } from '../../hooks/useSkillsCount';

const AiInsightsSkillsCard: React.FC = () => {
    const history = useHistory();

    const handleExploreClick = () => {
        history.push('/skills');
    };

    const { total } = useSkillsCount();

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

export default AiInsightsSkillsCard;
