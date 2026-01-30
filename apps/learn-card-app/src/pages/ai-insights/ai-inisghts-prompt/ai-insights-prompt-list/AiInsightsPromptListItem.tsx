import React from 'react';
import { useHistory } from 'react-router-dom';

import { AiInsightsIconOutline } from 'learn-card-base/svgs/wallet/AiInsightsIcon';
import RightArrow from 'learn-card-base/svgs/RightArrow';

import {
    AiSessionMode,
    NewAiSessionStepEnum,
} from '../../../../components/new-ai-session/newAiSession.helpers';

import { chatBotStore } from '../../../../stores/chatBotStore';
import { resetChatStores } from 'learn-card-base/stores/nanoStores/chatStore';
import { ChatBotQuestionsEnum } from '../../../../components/new-ai-session/NewAiSessionChatBot/newAiSessionChatbot.helpers';

export const AiInsightsPromptListItem: React.FC<{ prompt: string }> = ({ prompt }) => {
    const history = useHistory();

    const setMode = chatBotStore.set.setMode;
    const setChatBotQA = chatBotStore.set.setChatBotQA;
    const setInternalAiChatBot = chatBotStore.set.setStartInternalAiChatBot;

    const handlePromptClick = () => {
        resetChatStores();
        setMode(AiSessionMode.insights);
        setChatBotQA([
            {
                id: 0,
                question: null,
                answer: 'New Topic',
                phraseToEmphasize: undefined,
            },
            {
                id: 1,
                question: 'What would you like to learn about?',
                answer: prompt,
                type: ChatBotQuestionsEnum.TopicSelection,
                phraseToEmphasize: 'learn',
            },
            {
                id: 2,
                question: 'What app do you want to use?',
                answer: 1,
                type: ChatBotQuestionsEnum.AppSelection,
                phraseToEmphasize: 'What app',
            },
        ]);
        setInternalAiChatBot(true);
        chatBotStore.set.setMode(AiSessionMode.insights);
        history.push(
            `/ai/topics?shortCircuitStep=${NewAiSessionStepEnum.newTopic}&selectedAppId=${1}`
        );
    };

    return (
        <div
            role="button"
            onClick={handlePromptClick}
            className="w-full flex items-center justify-start bg-indigo-600 px-3 rounded-[10px] h-[62px]"
        >
            <div className="w-full flex items-center justify-start gap-2">
                <AiInsightsIconOutline className="text-white w-[25px] h-[25px] min-w-[25px] min-h-[25px]" />
                <p className="text-left text-sm text-white line-clamp-2 font-semibold">{prompt}</p>
            </div>
            <RightArrow className="text-white w-[20px] h-[20px]" />
        </div>
    );
};

export default AiInsightsPromptListItem;
