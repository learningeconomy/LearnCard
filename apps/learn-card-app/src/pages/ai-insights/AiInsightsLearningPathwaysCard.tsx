import React from 'react';
import { useHistory } from 'react-router-dom';

import PathwaysInsightsIcon from 'learn-card-base/svgs/PathwaysInsightsIcon';

const AiInsightsLearningPathwaysCard: React.FC = () => {
    const history = useHistory();

    const handleExploreClick = () => {
        return; // disable pathway redirect
        history.push('/ai/pathways');
    };

    return (
        <div
            role="button"
            onClick={handleExploreClick}
            className="w-full flex items-center justify-center mb-2 mt-4 overflow-hidden rounded-full"
        >
            <div className="w-full bg-teal-500 rounded-full flex items-center h-[65px] max-h-[65px] justify-start relative shadow-bottom-2-4 overflow-hidden">
                <div className="ml-[-5px] mt-[10px]">
                    <PathwaysInsightsIcon position="horizontal" className="w-auto h-[80px]" />
                </div>
            </div>
        </div>
    );
};

export default AiInsightsLearningPathwaysCard;
