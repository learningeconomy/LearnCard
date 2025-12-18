import React from 'react';
import { useHistory } from 'react-router-dom';

import SkillsInsightIcon from 'learn-card-base/svgs/SkillsInsightIcon';

const AiInsightsSkillsCardSimple: React.FC = () => {
    const history = useHistory();

    const handleExploreClick = () => history.push('/skills');

    return (
        <div
            role="button"
            onClick={handleExploreClick}
            className="w-full flex items-center justify-center my-4 overflow-hidden rounded-full"
        >
            <div className="w-full bg-violet-600 rounded-full flex items-center h-[65px] max-h-[65px] justify-start relative shadow-bottom-2-4 overflow-hidden">
                <div className="ml-[-5px] mt-[10px]">
                    <SkillsInsightIcon position="horizontal" className="w-auto h-[80px]" />
                </div>
            </div>
        </div>
    );
};

export default AiInsightsSkillsCardSimple;
