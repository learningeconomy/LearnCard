import React, { useEffect, useState } from 'react';

import AiSessionLearningPathways from '../AiSessionLearningPathways/AiSessionLearningPathways';
import { ChatBotBubbleAnswer, ChatBotBubbleQuestion } from './helpers/ChatBotBubble';
import ExistingAiTopics from './ExistingAiTopics/ExistingAiTopics';
import ChatBotTypingIndicator from './helpers/TypingIndicator';
import ExistingTopicSearch from './helpers/ExistingTopicSearch';

import {
    ChatBotQA,
    ChatBotQuestionsEnum,
    existingSessionQAInitState,
} from './newAiSessionChatbot.helpers';
import { NewAiSessionStepEnum } from '../newAiSession.helpers';
import { useDeviceTypeByWidth, LaunchPadAppListItem, usePathQuery } from 'learn-card-base';

import { chatBotStore, useChatBotQAExisting } from '../../../stores/chatBotStore';

export const ExistingAiSessionChatBotContainer: React.FC<{
    setActiveStep: (step: NewAiSessionStepEnum) => void;
    handleStartOver?: () => void;
    selectedApp?: LaunchPadAppListItem;
}> = ({ setActiveStep, handleStartOver, selectedApp }) => {
    const query = usePathQuery();
    const { isDesktop } = useDeviceTypeByWidth();
    // const [chatBotQA, setChatBotQA] = useState<ChatBotQA[]>(existingSessionQAInitState);

    const { chatBotQA } = useChatBotQAExisting(existingSessionQAInitState);
    const setChatBotQA = chatBotStore.set.setExistingChatBotQA;

    // const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
    const visibleIndexes = chatBotStore.useTracked.visibleIndexes();
    const setVisibleIndexes = chatBotStore.set.setVisibleIndexes;

    // const [typingIndex, setTypingIndex] = useState<number | null>(null);
    const typingIndex = chatBotStore.useTracked.typingIndex();
    const setTypingIndex = chatBotStore.set.setTypingIndex;

    const [search, setSearch] = useState<string | null | undefined>('');

    // If a preselected app is passed in the query or as a prop, use it
    const preselectedAppId = Number(query.get('selectedAppId')) || selectedApp?.id || null;

    useEffect(() => {
        const timeouts: NodeJS.Timeout[] = [];

        chatBotQA.forEach((qa, index) => {
            if (index === 0) {
                setVisibleIndexes(prev => [...prev, index]);
                return;
            }

            const delay = index * 1000;

            timeouts.push(
                setTimeout(() => {
                    setTypingIndex(index);
                    const typingTimeout = setTimeout(() => {
                        setVisibleIndexes(prev => [...prev, index]);
                        setTypingIndex(null);
                    }, 1000);

                    timeouts.push(typingTimeout);
                }, delay)
            );
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    const handleChatBotAnswer = (
        question: ChatBotQuestionsEnum,
        answer?: string,
        currentIndex?: number
    ) => {
        setChatBotQA(prevState =>
            prevState.map(qa => {
                if (qa.type === question) {
                    return { ...qa, answer };
                }
                return qa;
            })
        );

        const nextIndex = (currentIndex ?? 0) + 1;

        setTypingIndex(nextIndex);

        setTimeout(() => {
            setVisibleIndexes(prev => [...prev, nextIndex]);
            setTypingIndex(null);
        }, 1000);
    };

    const handleEditChatBotAnswer = (indexToEdit: number) => {
        // if index is 0, return to selecting a topic type
        if (indexToEdit === 0) {
            if (isDesktop) {
                handleStartOver?.();
            } else {
                setActiveStep(NewAiSessionStepEnum.topicSelector);
            }
            return;
        }

        setChatBotQA(prevState =>
            prevState.map((qa, index) => (index >= indexToEdit ? { ...qa, answer: null } : qa))
        );

        setVisibleIndexes(prev => prev.filter(index => index < indexToEdit));

        setTypingIndex(indexToEdit);

        setTimeout(() => {
            setVisibleIndexes(prev => [...prev, indexToEdit]);
            setTypingIndex(null);
        }, 1000);
    };

    return (
        <div
            className={`w-full flex flex-col overflow-y-auto ${
                isDesktop ? 'max-w-[800px]' : ''
            } scrollbar-hide relative`}
        >
            {chatBotQA.map((qa, index) => {
                const isVisible = visibleIndexes.includes(index);
                const isTyping = typingIndex === index;

                if (!isVisible && !isTyping) return null;

                const isIntro = index === 0;
                const hasAnswer = !!qa.answer;
                const showQuestion = index === 1 || (index > 1 && chatBotQA[index - 1]?.answer);

                return (
                    <React.Fragment key={qa.id}>
                        <div
                            className="w-full relative transition-all duration-200"
                            style={{ minHeight: typingIndex === index ? '60px' : undefined }}
                        >
                            {isTyping && typingIndex === index && (
                                <div className="transition-opacity duration-150">
                                    <ChatBotTypingIndicator />
                                </div>
                            )}

                            {!isTyping && showQuestion && qa.question && (
                                <div className="transition-opacity duration-150">
                                    <ChatBotBubbleQuestion qa={qa} index={index} />
                                </div>
                            )}
                        </div>

                        {(isIntro || hasAnswer) && (
                            <ChatBotBubbleAnswer
                                qa={qa}
                                index={index}
                                handleEditChatBotAnswer={handleEditChatBotAnswer}
                            />
                        )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.ResumeTopic &&
                            !qa.answer && (
                                <ExistingAiTopics
                                    handleChatBotAnswer={handleChatBotAnswer}
                                    search={search}
                                    currentQuestionIndex={index}
                                    selectedAppId={preselectedAppId}
                                />
                            )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.ResumeTopic &&
                            !qa.answer && (
                                <ExistingTopicSearch search={search} setSearch={setSearch} />
                            )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.LearningPathway &&
                            !qa.answer && <AiSessionLearningPathways chatBotQA={chatBotQA} />}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default ExistingAiSessionChatBotContainer;
