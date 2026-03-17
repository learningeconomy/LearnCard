import React from 'react';

import X from 'learn-card-base/svgs/X';
import AiInsightsPromptBox from '../AiInsightsPromptBox';
import AiInsightsPromptList from '../ai-insights-prompt-list/AiInsightsPromptList';

import { useModal } from 'learn-card-base';

export const AiInsightsExploreMoreModal: React.FC = () => {
    const { closeModal } = useModal();

    return (
        <div className="w-full h-full flex flex-col bg-white">
            {/* Fixed Header */}
            <div className="flex-shrink-0 flex flex-col p-4 gap-4">
                <div className="flex items-center justify-between gap-[10px]">
                    <h1 className="text-2xl font-semibold text-indigo-500">
                        Explore Your Insights
                    </h1>
                    <button
                        onClick={() => closeModal()}
                        className="bg-grayscale-200 p-[10px] rounded-full"
                    >
                        <X className="w-6 h-6 text-grayscale-900" />
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <ul className="flex-1 overflow-y-auto px-4 pb-4 desktop:max-h-[700px]">
                <AiInsightsPromptBox />
                <div className="h-[1px] bg-grayscale-200 w-full my-4" />
                <AiInsightsPromptList showTitle={false} />
            </ul>
        </div>
    );
};

export default AiInsightsExploreMoreModal;
