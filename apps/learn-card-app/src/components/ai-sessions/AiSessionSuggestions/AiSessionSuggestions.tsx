import React from 'react';

import AiSessionSuggestionsList from './AiSessionSuggestionsList';
import ExperimentalFeatureBox from 'apps/learn-card-app/src/components/generic/ExperimentalFeatureBox';
import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../../new-ai-session/NewAiSessionButton/NewAiSessionButton';

import { NewAiSessionStepEnum } from '../../new-ai-session/newAiSession.helpers';
import { useHasConsentedToAiApp } from 'apps/learn-card-app/src/hooks/useAiSession';

export const AiSessionSuggestions: React.FC<{
    handleSetChatBotSelected: (chatBotType: NewAiSessionStepEnum) => void;
}> = ({ handleSetChatBotSelected }) => {
    const { hasConsentedToAiApps } = useHasConsentedToAiApp();

    return (
        <div className="w-full flex items-center justify-center h-full">
            <div className="w-full max-w-[80%] flex items-center justify-center flex-col">
                <ExperimentalFeatureBox className="max-w-[325px] mb-[15px]" />

                {/* title */}
                <div className="w-full flex items-center justify-center flex-col">
                    <h1 className="text-xl text-grayscale-900 font-semibold text-center">
                        What would you like to learn today?
                    </h1>
                    <p className="text-grayscale-600 text-center font-notoSans mt-2">
                        Explore something new, or continue learning from what you’ve already
                        started.
                    </p>
                </div>

                {/* buttons */}
                <div className="w-full bg-indigo-50 items-center justify-around py-6 px-6 flex mt-8 rounded-[16px] max-w-[800px]">
                    <NewAiSessionButton
                        shortCircuitStep={NewAiSessionStepEnum.newTopic}
                        type={NewAiSessionButtonEnum.start}
                        onClick={() => {
                            if (!hasConsentedToAiApps) {
                                handleSetChatBotSelected(NewAiSessionStepEnum.aiAppSelector);
                            } else {
                                handleSetChatBotSelected(NewAiSessionStepEnum.newTopic);
                            }
                        }}
                    />
                    <NewAiSessionButton
                        shortCircuitStep={NewAiSessionStepEnum.revisitTopic}
                        type={NewAiSessionButtonEnum.revisit}
                        onClick={() => {
                            handleSetChatBotSelected(NewAiSessionStepEnum.revisitTopic);
                        }}
                    />
                </div>

                {/* suggestions */}
                {/* 
                    // TODO: Generate suggestions
                */}
                {/* <div className="w-full flex flex-col items-center justify-center max-w-[800px]">
                    <div className="w-full flex items-center justify-between mt-8 rounded-[16px]">
                        <h1 className="text-xl text-grayscale-600 text-[17px] text-center">
                            Suggested Pathways
                        </h1>
                        <button className="text-indigo-500 font-semibold text-[17px]">
                            Reroll
                        </button>
                    </div>
                    <AiSessionSuggestionsList />
                </div> */}
            </div>
        </div>
    );
};

export default AiSessionSuggestions;
