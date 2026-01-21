import React from 'react';

import AiInsightsPromptListItem from './AiInsightsPromptListItem';

import { DEFAULT_PROMPTS } from '../ai-insights-prompt-helpers';

export const AiInsightsPromptList: React.FC<{ showTitle?: boolean }> = ({ showTitle = true }) => {
    return (
        <div role="button" className="w-full flex flex-col items-center justify-center gap-2">
            {showTitle && (
                <div className="w-full flex items-center justify-start">
                    <h2 className="text-grayscale-600 text-sm font-medium">
                        Explore Your Insights
                    </h2>
                </div>
            )}
            {DEFAULT_PROMPTS.map(({ prompt }, index) => (
                <AiInsightsPromptListItem key={index} prompt={prompt} />
            ))}
        </div>
    );
};

export default AiInsightsPromptList;
