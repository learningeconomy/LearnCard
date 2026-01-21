import React from 'react';

import AiInsightsPromptBox from './AiInsightsPromptBox';
import AiInsightsPromptList from './ai-insights-prompt-list/AiInsightsPromptList';
import AiInsightsExploreMoreButton from './ai-insights-explore-more-modal/AiInsightsExploreMoreButton';

export const AiInsightsPromptBoxContainer: React.FC = () => {
    return (
        <div className="w-full bg-white items-center justify-center flex flex-col shadow-bottom-2-4 p-[15px] rounded-[15px] gap-4 mt-4">
            <AiInsightsPromptBox />
            <div className="h-[1px] bg-grayscale-200 w-full" />
            <AiInsightsPromptList />
            <AiInsightsExploreMoreButton />
        </div>
    );
};

export default AiInsightsPromptBoxContainer;
