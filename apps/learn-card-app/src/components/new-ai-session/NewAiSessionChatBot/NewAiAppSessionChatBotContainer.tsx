import React, { useEffect, useState, useMemo } from 'react';

import { ChatBotBubbleAnswer, ChatBotBubbleQuestion } from './helpers/ChatBotBubble';
import AiSessionAppSelector from '../AiSessionAppSelector/AiSessionAppSelector';
import StartAiSessionButton from './helpers/StartAiSessionButton';
import ChatBotTypingIndicator from './helpers/TypingIndicator';
import AiSessionLoader from '../AiSessionLoader';
import TopicInput from './helpers/TopicInput';

import { aiAppQAInitState, ChatBotQA, ChatBotQuestionsEnum } from './newAiSessionChatbot.helpers';

import { useModal } from 'learn-card-base';
import { LaunchPadAppListItem, useDeviceTypeByWidth } from 'learn-card-base';
import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';
import { useGetCurrentLCNUser } from 'learn-card-base';
import { sessionLoadingText } from '../newAiSession.helpers';
import useAppStore from '../../../pages/launchPad/useAppStore';

// Extended type to include url for launching
type AiTutorApp = LaunchPadAppListItem & { 
    url: string;
    isAppStoreListing?: boolean;
    listingId?: string;
};

export const NewAiAppSessionChatBotContainer: React.FC<{}> = () => {
    const { isDesktop } = useDeviceTypeByWidth();
    const { closeAllModals } = useModal();
    const [chatBotQA, setChatBotQA] = useState<ChatBotQA[]>(aiAppQAInitState);

    const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
    const [typingIndex, setTypingIndex] = useState<number | null>(null);

    const [showLoader, setShowLoader] = useState<boolean>(false);

    const { currentLCNUser } = useGetCurrentLCNUser();

    // Fetch installed AI_TUTOR apps from app store
    const { useInstalledApps } = useAppStore();
    const { data: installedAppsData } = useInstalledApps();

    // Convert installed AI_TUTOR apps to the same format as hardcoded apps
    const installedAiTutorApps: AiTutorApp[] = useMemo(() => {
        if (!installedAppsData?.records) return [];

        return installedAppsData.records
            .filter(app => (app.launch_type as string) === 'AI_TUTOR')
            .map(app => {
                let launchConfig: { aiTutorUrl?: string; contractUri?: string } = {};

                try {
                    launchConfig = JSON.parse(app.launch_config_json);
                } catch {}

                return {
                    id: app.listing_id,
                    name: app.display_name,
                    description: app.tagline,
                    img: app.icon_url,
                    isConnected: true,
                    displayInLaunchPad: true,
                    handleConnect: () => {},
                    handleView: () => {},
                    contractUri: launchConfig.contractUri,
                    url: launchConfig.aiTutorUrl || '',
                    isAppStoreListing: true,
                    listingId: app.listing_id,
                };
            })
            .filter(app => app.url); // Only include apps with valid URL
    }, [installedAppsData]);

    // Combine hardcoded apps with installed AI_TUTOR apps
    const allAiTutorApps: AiTutorApp[] = useMemo(() => {
        return [...aiPassportApps, ...installedAiTutorApps];
    }, [installedAiTutorApps]);

    useEffect(() => {
        setVisibleIndexes([0]);
    }, []);

    useEffect(() => {
        const timeouts: NodeJS.Timeout[] = [];

        chatBotQA.forEach((qa, index) => {
            if (index === 0) return;

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

    const handleSetAiApp = (app: LaunchPadAppListItem) => {
        setChatBotQA(prevState =>
            prevState.map((qa, index) => {
                if (index === 0) {
                    return {
                        ...qa,
                        answer: app.id.toString(),
                        type: ChatBotQuestionsEnum.AppSelection,
                    };
                }
                return qa;
            })
        );

        const nextIndex = 1;

        setTypingIndex(nextIndex);

        setTimeout(() => {
            setVisibleIndexes(prev => [...prev, nextIndex]);
            setTypingIndex(null);
        }, 1000);
    };

    const handleStartAiSession = () => {
        setShowLoader(true);

        setTimeout(() => {
            closeAllModals();
            const topicAnswer = chatBotQA.find(
                qa => qa.type === ChatBotQuestionsEnum.TopicSelection
            )?.answer;
            const appAnswer = chatBotQA.find(
                qa => qa.type === ChatBotQuestionsEnum.AppSelection
            )?.answer;

            // Find the app from combined list (hardcoded + installed)
            const selectedApp = allAiTutorApps.find(app => app.id.toString() === appAnswer);

            if (selectedApp?.url) {
                // App store listings use /chats path, hardcoded apps use /chat
                const path = selectedApp.isAppStoreListing ? '/chats' : '/chat';

                window.location.href = `${selectedApp.url}${path}?topic=${encodeURIComponent(
                    topicAnswer || ''
                )}&did=${currentLCNUser?.did}`;
            }
        }, 3000);
    };

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
                const showQuestion = isIntro || (index > 0 && chatBotQA[index - 1]?.answer);
                const showStartButton =
                    index === chatBotQA.length - 1 &&
                    qa.type === ChatBotQuestionsEnum.TopicSelection &&
                    hasAnswer;

                return (
                    <React.Fragment key={qa.id}>
                        <div
                            className="w-full relative transition-all duration-200"
                            style={{
                                minHeight:
                                    typingIndex === index && showQuestion ? '60px' : undefined,
                            }}
                        >
                            {showQuestion && isTyping && typingIndex === index && (
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

                        {hasAnswer && (
                            <ChatBotBubbleAnswer
                                qa={qa}
                                index={index}
                                handleEditChatBotAnswer={handleEditChatBotAnswer}
                                className={index === 0 ? '!pt-4' : ''}
                            />
                        )}

                        {!isTyping &&
                            qa.type === ChatBotQuestionsEnum.TopicSelection &&
                            !hasAnswer &&
                            showQuestion && (
                                <TopicInput
                                    handleChatBotAnswer={handleChatBotAnswer}
                                    index={index}
                                />
                            )}

                        {isIntro && !hasAnswer && (
                            <AiSessionAppSelector 
                                handleSetAiApp={handleSetAiApp} 
                                apps={allAiTutorApps}
                            />
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

export default NewAiAppSessionChatBotContainer;
