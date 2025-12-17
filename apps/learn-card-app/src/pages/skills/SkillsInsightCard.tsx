import React from 'react';
import { useHistory } from 'react-router-dom';

import SkillsInsightIcon from 'learn-card-base/svgs/SkillsInsightIcon';

const SkillsInsightCard: React.FC = () => {
    const history = useHistory();

    const handleExploreClick = () => {
        history.push('/ai/insights');
    };

    return (
        <div className="w-full flex items-center justify-center">
            <div className="w-full bg-indigo-600 rounded-[16px] flex items-center justify-between mb-4 relative shadow-soft-bottom">
                <div className="flex flex-col items-start justify-center py-4 pl-4">
                    <h2 className="font-poppins font-semibold text-[20px] text-grayscale-50 text-left">
                        AI Insights
                    </h2>
                    <p className="font-poppins font-semibold text-[14px] text-indigo-50 text-left my-2">
                        <span className="font-normal text-grayscale-200">Your</span> top skills,
                        learning
                        <br /> snapshots, suggested lessons <br /> & careers,
                        <span className="font-normal text-grayscale-200">and</span> TEDed content.
                    </p>
                    <button
                        onClick={handleExploreClick}
                        className="rounded-full bg-white text-indigo-600 font-semibold px-6 py-2 mt-2 uppercase"
                    >
                        Explore
                    </button>
                </div>
                <div className="flex items-end justify-end">
                    <SkillsInsightIcon className="mt-[35px] mr-4" />
                </div>
            </div>
        </div>
    );
};

export default SkillsInsightCard;
