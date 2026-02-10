import React, { useEffect, useState } from 'react';

import { ChatBotBubbleAnswer, ChatBotBubbleQuestion } from './helpers/ChatBotBubble';
import LearnCardAiChatBot from '../LearnCardAiChatBot/LearnCardAiChatBot';
import StartAiSessionButton from './helpers/StartAiSessionButton';
import ChatBotTypingIndicator from './helpers/TypingIndicator';
import ChatBotAppList from './helpers/ChatBotAppList';
import AiSessionLoader from '../AiSessionLoader';
import TopicInput from './helpers/TopicInput';

import {
    ChatBotQA,
    ChatBotQuestionsEnum,
    newSessionQAInitState,
} from './newAiSessionChatbot.helpers';

import {
    useGetCurrentLCNUser,
    useModal,
    useDeviceTypeByWidth,
    LaunchPadAppListItem,
} from 'learn-card-base';
import { NewAiSessionStepEnum } from '../newAiSession.helpers';

import {
    AiPassportAppContractUri,
    aiPassportApps,
    AiPassportAppsEnum,
} from '../../ai-passport-apps/aiPassport-apps.helpers';
import { sessionLoadingText } from '../newAiSession.helpers';
import { usePathQuery } from 'learn-card-base';

import { chatBotStore, useChatBotQA } from '../../../stores/chatBotStore';

export const NewAiSessionChatBotContainer: React.FC<{
    setActiveStep: (step: NewAiSessionStepEnum) => void;
    handleStartOver?: () => void;
    disableEdit?: boolean;
    startInternalAiChatBot?: boolean;
    setStartInternalAiChatBot?: (StartInternalAiChatBot: boolean) => void;
    selectedApp?: LaunchPadAppListItem;
}> = ({
    setActiveStep,
    handleStartOver,
    disableEdit,
    startInternalAiChatBot,
    setStartInternalAiChatBot,
    selectedApp,
}) => {
    const query = usePathQuery();
    const { isDesktop } = useDeviceTypeByWidth();
    const { closeAllModals } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();

    // const [chatBotQA, setChatBotQA] = useState<ChatBotQA[]>(newSessionQAInitState);
    const { chatBotQA: chatBotQA } = useChatBotQA(newSessionQAInitState);
    const setChatBotQA = chatBotStore.set.setChatBotQA;

    // const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
    const visibleIndexes = chatBotStore.useTracked.visibleIndexes();
    const setVisibleIndexes = chatBotStore.set.setVisibleIndexes;

    // const [typingIndex, setTypingIndex] = useState<number | null>(null);
    const typingIndex = chatBotStore.useTracked.typingIndex();
    const setTypingIndex = chatBotStore.set.setTypingIndex;

    const [showLoader, setShowLoader] = useState<boolean>(false);

    // If a preselected app is passed in the query or as a prop, use it
    const preselectedAppId = Number(query.get('selectedAppId')) || selectedApp?.id || null;

    const topicAnswer = chatBotQA.find(
        qa => qa.type === ChatBotQuestionsEnum.TopicSelection
    )?.answer;
    const appAnswer = chatBotQA.find(qa => qa.type === ChatBotQuestionsEnum.AppSelection)?.answer;
    const app = aiPassportApps.find(app => Number(app.id) === Number(appAnswer)); // ! hot fix for type mismatch

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

    useEffect(() => {
        if (!preselectedAppId || !topicAnswer) return;

        setChatBotQA(prevState =>
            prevState.map(qa => {
                if (
                    qa.type === ChatBotQuestionsEnum.AppSelection &&
                    !qa.answer // ← don't override user input
                ) {
                    return { ...qa, answer: preselectedAppId };
                }
                return qa;
            })
        );
    }, [selectedApp, topicAnswer, preselectedAppId]);

    const handleChatBotAnswer = (
        question: ChatBotQuestionsEnum,
        answer: string,
        currentIndex: number
    ) => {
        setChatBotQA(prevState =>
            prevState.map(qa => {
                if (qa.type === question) {
                    return { ...qa, answer };
                }
                return qa;
            })
        );

        const nextIndex = currentIndex + 1;

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

    const handleStartAiSession = () => {
        if (app?.type === AiPassportAppsEnum.learncardapp) {
            setStartInternalAiChatBot?.(true);
            return;
        }

        setShowLoader(true);

        setTimeout(() => {
            closeAllModals();
            const topicAnswer = chatBotQA.find(
                qa => qa.type === ChatBotQuestionsEnum.TopicSelection
            )?.answer;

            const appAnswer = chatBotQA.find(
                qa => qa.type === ChatBotQuestionsEnum.AppSelection
            )?.answer;

            const url = aiPassportApps.find(app => app.id === appAnswer)?.url;

            window.location.href = `${url}/chats?topic=${encodeURIComponent(
                // window.location.href = `http://localhost:4321/chats?topic=${encodeURIComponent(
                topicAnswer || ''
            )}&did=${currentLCNUser?.did}`;
        }, 3000);
    };

    if (startInternalAiChatBot && app?.type === AiPassportAppsEnum.learncardapp && topicAnswer) {
        return (
            <LearnCardAiChatBot
                initialMessages={[]}
                initialTopic={topicAnswer ?? undefined}
                contractUri={AiPassportAppContractUri.learncardapp}
                handleStartOver={handleStartOver}
            />
        );
    }

    return (
        <div className={`w-full flex flex-col ${isDesktop ? 'max-w-[800px]' : ''}`}>
            {showLoader && (
                <AiSessionLoader chatBotQA={chatBotQA} overrideText={sessionLoadingText} />
            )}
            {chatBotQA.map((qa, index) => {
                const isVisible = visibleIndexes.includes(index);
                const isTyping = typingIndex === index;

                if (!isVisible && !isTyping) return null;

                const isIntro = index === 0;
                const hasAnswer = !!qa.answer;
                const showQuestion = index === 1 || (index > 1 && chatBotQA[index - 1]?.answer);
                const showStartButton =
                    index === chatBotQA.length - 1 &&
                    qa.type === ChatBotQuestionsEnum.AppSelection &&
                    hasAnswer;

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
                                disableEdit={disableEdit}
                            />
                        )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.TopicSelection &&
                            !hasAnswer && (
                                <TopicInput
                                    handleChatBotAnswer={handleChatBotAnswer}
                                    index={index}
                                />
                            )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.AppSelection &&
                            showQuestion &&
                            !hasAnswer && (
                                <ChatBotAppList handleChatBotAnswer={handleChatBotAnswer} />
                            )}

                        {showStartButton && (
                            <StartAiSessionButton handleStartSession={handleStartAiSession} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default NewAiSessionChatBotContainer;
