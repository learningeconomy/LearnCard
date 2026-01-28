import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import AiInsightsPromptBoxInput from './AiInsightsPromptBoxInput';

import {
    AiSessionMode,
    NewAiSessionStepEnum,
} from '../../../components/new-ai-session/newAiSession.helpers';

import { chatBotStore } from '../../../stores/chatBotStore';
import { resetChatStores } from 'learn-card-base/stores/nanoStores/chatStore';
import { ChatBotQuestionsEnum } from '../../../components/new-ai-session/NewAiSessionChatBot/newAiSessionChatbot.helpers';

export const AiInsightsPromptBox: React.FC = () => {
    const history = useHistory();

    const setMode = chatBotStore.set.setMode;
    const setChatBotQA = chatBotStore.set.setChatBotQA;
    const setInternalAiChatBot = chatBotStore.set.setStartInternalAiChatBot;

    const [prompt, setPrompt] = useState<string>('');

    const promptIsEmpty = !prompt || prompt.trim() === '';

    const handleSubmitPrompt = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (promptIsEmpty) return;
        resetChatStores();
        chatBotStore.set.resetStore();
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
        <form
            onSubmit={handleSubmitPrompt}
            className="w-full items-center justify-center flex flex-col gap-4"
        >
            <AiInsightsPromptBoxInput prompt={prompt} setPrompt={setPrompt} />
            <button
                disabled={promptIsEmpty}
                type="submit"
                className={`text-xl text-white flex items-center justify-center font-semibold px-4 py-[12px] rounded-full shadow-soft-bottom w-full ${
                    promptIsEmpty ? 'bg-grayscale-600 opacity-50' : 'bg-indigo-600'
                }`}
            >
                Let's Go!
            </button>
        </form>
    );
};

export default AiInsightsPromptBox;
