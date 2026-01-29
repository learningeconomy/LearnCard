import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { useDeviceTypeByWidth, LEARNCARD_AI_URL } from 'learn-card-base';

import ChatInput from './ChatInput';
import CaretDown from '../../svgs/CaretDown';
import AiChatLoading from './AiChatLoading';
import AiSessionLoader from '../AiSessionLoader';
import MessageWithQuestions from './MessageWithQuestions';

import {
    messages,
    isTyping,
    startTopic,
    startTopicWithUri,
    startLearningPathway,
    currentThreadId,
    isLoading,
    isEndingSession,
    showEndingSessionLoader,
    disconnectWebSocket,
    startInsightsSession,
} from 'learn-card-base/stores/nanoStores/chatStore';
import { auth } from 'learn-card-base/stores/nanoStores/authStore';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

import { sessionWrapUpText, AiSessionMode } from '../newAiSession.helpers';
import { AiPassportAppContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';

export const BACKEND_URL = LEARNCARD_AI_URL;

type LearnCardAiChatBotProps = {
    initialMessages: ChatMessage[];
    initialTopic?: string | undefined;
    initialTopicUri?: string | undefined;
    contractUri?: string | undefined;
    handleStartOver?: () => void;
    mode?: AiSessionMode;
};

export const LearnCardAiChatBot: React.FC<LearnCardAiChatBotProps> = ({
    initialMessages = [],
    initialTopic = undefined,
    initialTopicUri: _initialTopicUri = undefined,
    contractUri = AiPassportAppContractUri.learncardapp,
    handleStartOver: _handleStartOver,
    mode = AiSessionMode.tutor,
}) => {
    const { isDesktop } = useDeviceTypeByWidth();
    const [showInitialMessages, setShowInitialMessages] = useState(true);
    const [topicInitialized, setTopicInitialized] = useState(() => {
        try {
            const existingThread = currentThreadId.get?.();
            const existingMsgs = (messages as any).get?.() as ChatMessage[] | undefined;
            return (
                Boolean(existingThread) ||
                Boolean(existingMsgs && existingMsgs.length > 0) ||
                initialMessages.length > 0
            );
        } catch {
            return initialMessages.length > 0;
        }
    });
    const allMessages = useStore(messages);
    const typing = useStore(isTyping);
    const isEnding = useStore(isEndingSession);
    const showEndingLoader = useStore(showEndingSessionLoader);
    const loading = useStore(isLoading);
    const authState = useStore(auth);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatInnerScrollRef = useRef<HTMLDivElement>(null);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Handle initial topic or topicUri when component mounts (and when auth is ready)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const initialTopicUri = _initialTopicUri || urlParams.get('topicUri');
        const pathwayUri = urlParams.get('pathwayUri');

        // If there is already an active thread or messages, do not re-initialize
        const existingThread = currentThreadId.get?.();
        const existingMsgs = (messages as any).get?.() as ChatMessage[] | undefined;
        if (existingThread || (existingMsgs && existingMsgs.length > 0)) {
            setTopicInitialized(true);
            return;
        }

        // If already initialized, do nothing
        if (topicInitialized) return;

        // Start by topic URI if provided, but only after DID is available
        if (initialTopicUri) {
            if (!authState?.did) return; // Wait for auth to be ready

            setTopicInitialized(true);
            if (pathwayUri) {
                startLearningPathway(initialTopicUri, pathwayUri);
            } else {
                startTopicWithUri(initialTopicUri);
            }
            return;
        }

        // Otherwise fall back to starting by a plain topic string (also wait for DID)
        if (initialTopic) {
            if (!authState?.did) return; // Wait for auth to be ready

            setTopicInitialized(true);

            if (mode === AiSessionMode.insights) {
                startInsightsSession(initialTopic);
            } else {
                startTopic(initialTopic, mode);
            }
        }
    }, [initialTopic, _initialTopicUri, topicInitialized, authState?.did]);

    // notify backend on visibility change (hidden/visible) for session management
    // Only trigger after being hidden for a substantial period to avoid brief tab switches
    useEffect(() => {
        let hiddenTimer: NodeJS.Timeout | null = null;

        const handleVisibility = () => {
            const threadId = currentThreadId.get();
            const { did } = auth.get();
            console.debug('visibility change', document.visibilityState, threadId, did);

            if (threadId && did) {
                if (document.visibilityState === 'hidden') {
                    // Only send "hidden" event after being hidden for 5 minutes
                    // This prevents brief tab switches from triggering auto-summary
                    // Also, only set the timer if one is not already running to prevent leaks.
                    if (!hiddenTimer) {
                        hiddenTimer = setTimeout(() => {
                            const form = new FormData();
                            form.append('did', did);
                            form.append('threadId', threadId);
                            form.append('event', 'hidden');
                            navigator.sendBeacon(
                                `${BACKEND_URL}/threads/visibility?did=${did}`,
                                form
                            );
                            console.debug('sent beacon after 5min hidden');
                            // After the timer fires, reset it to null so a new one can be created.
                            hiddenTimer = null;
                        }, 5 * 60 * 1000); // 5 minutes
                    }
                } else if (document.visibilityState === 'visible') {
                    // Cancel the hidden timer if user comes back
                    if (hiddenTimer) {
                        clearTimeout(hiddenTimer);
                        hiddenTimer = null;
                    }
                    // Send visible event immediately to cancel any existing timers
                    const form = new FormData();
                    form.append('did', did);
                    form.append('threadId', threadId);
                    form.append('event', 'visible');
                    navigator.sendBeacon(`${BACKEND_URL}/threads/visibility?did=${did}`, form);
                    console.debug('sent beacon visible');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            if (hiddenTimer) {
                clearTimeout(hiddenTimer);
            }
        };
    }, []);

    // Cleanup WebSocket on unmount to avoid overlapping streams when navigating away
    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (initialMessages?.length > 0) {
            const existingMsgs = (messages as any).get?.() as ChatMessage[] | undefined;
            if (!existingMsgs || existingMsgs.length === 0) {
                messages.set(initialMessages);
            }
        }
        setShowInitialMessages(false);
    }, [initialMessages]);

    let messagesToShow = (showInitialMessages ? initialMessages : allMessages) ?? [];

    const [scrollToBottomSmooth, setScrollToBottomSmooth] = useState(false);
    const [scrollToBottomInstant, setScrollToBottomInstant] = useState(false);

    useEffect(() => {
        // This useEffect is specifically for handling new messages added to the chat
        // In certain cases (the second assistant message + all user messages) when a new message is added:
        //   put that new message at the top of the chat
        //   by setting the scroll offset to the container height - last message height
        //   and scrolling to the bottom of the chat

        if (messagesToShow.length > 1) {
            // we only want to change the scroll offset if the last message is an user message
            const lastIndex = messagesToShow.length - 1;
            const secondToLastIndex = messagesToShow.length - 2;

            const latestMessage = messagesToShow[lastIndex];

            const indexToUse =
                messagesToShow.length === 2 || messagesToShow[lastIndex].role === 'user'
                    ? lastIndex
                    : secondToLastIndex;

            if (messagesToShow.length > 2 && latestMessage.role === 'assistant') {
                // we don't want to mess with the offset if the newest message is an assistant message
                // that's a response to a user message
                return;
            }

            const scrollAnchorMessageElement = messageRefs.current[indexToUse];

            if (scrollAnchorMessageElement) {
                const chatContainerHeight = chatContainerRef.current?.offsetHeight;
                const scrollAnchorMessageHeight = scrollAnchorMessageElement.offsetHeight;

                let offset = chatContainerHeight! - scrollAnchorMessageHeight;
                offset = Math.max(0, offset);

                setScrollOffset(offset);

                setScrollToBottomSmooth(true);
            }
        }
    }, [messagesToShow.length]);

    // Handle scroll events to detect if we're at the bottom
    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const isBottom = distanceFromBottom < 50; // 50px threshold
            setIsAtBottom(isBottom);
        };

        const container = chatContainerRef.current;
        container?.addEventListener('scroll', handleScroll);

        // Initial check after a small delay to ensure container is rendered
        const timer = setTimeout(() => {
            handleScroll();
        }, 200);

        return () => {
            clearTimeout(timer);
            container?.removeEventListener('scroll', handleScroll);
        };
    }, [messageRefs.current[messagesToShow.length - 1]?.offsetHeight]);

    useEffect(() => {
        if (scrollToBottomSmooth) {
            chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current?.scrollHeight,
                behavior: 'smooth',
            });
            setIsAtBottom(true);
            setScrollToBottomSmooth(false);
        }
    }, [scrollToBottomSmooth]);

    useEffect(() => {
        if (scrollToBottomInstant) {
            chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current?.scrollHeight,
                behavior: 'instant',
            });
            setScrollToBottomInstant(false);
        }
    }, [scrollToBottomInstant]);

    useEffect(() => {
        // When the last message's height changes, we want to update the scroll offset
        // so that there isn't just a bunch of extra whitespace at the bottom of the chat

        if (messagesToShow.length > 1) {
            const lastIndex = messagesToShow.length - 1;
            const secondToLastIndex = messagesToShow.length - 2;

            const latestMessage = messagesToShow[lastIndex];
            const latestMessageElement = messageRefs.current[lastIndex];
            const secondToLastMessageElement = messageRefs.current[secondToLastIndex];

            if (latestMessageElement) {
                const chatContainerHeight = chatContainerRef.current?.offsetHeight;
                const secondToLastMessageHeight = secondToLastMessageElement?.offsetHeight;
                const latestMessageHeight = latestMessageElement.offsetHeight;

                let offset;
                if (messagesToShow.length === 2) {
                    // This is the second assistant message (i.e. the first prompt after the initial assistant message)
                    offset = chatContainerHeight! - latestMessageHeight!;
                } else if (messagesToShow.length > 2 && latestMessage.role === 'assistant') {
                    // This is the assistant response to a user message
                    //   We want to keep the user message at the top, but shrink the whitespace as the assistant message is typed
                    offset =
                        chatContainerHeight! - latestMessageHeight! - secondToLastMessageHeight!;

                    // Note: We don't want to change antying if the latestMessage is a user message since all that scrolling and offset handling
                    //       was done in the first useEffect
                }

                if (offset !== undefined) {
                    offset = Math.max(0, offset);

                    if (offset !== scrollOffset) {
                        setScrollOffset(offset);

                        if (offset > 0) {
                            setScrollToBottomInstant(true);
                        }
                    }
                }
            }
        }
    }, [messageRefs.current[messagesToShow.length - 1]?.offsetHeight, typing]);

    return (
        <div
            className={`flex flex-col h-full min-h-[32rem] w-full max-w-[829px] mx-auto sm:pb-[30px] bg-white ${
                isDesktop ? 'pt-[100px]' : ''
            }`}
        >
            {isEnding && showEndingLoader && (
                <AiSessionLoader
                    contractUri={contractUri}
                    overrideText={sessionWrapUpText}
                    // !force user to wait
                    // showActionButton={true}
                    // actionButtonText="Back to AI Sessions"
                    // actionButtonHandler={() => {
                    //     closeModal();
                    //     if (isDesktop) {
                    //         handleStartOver?.();
                    //     }
                    //     history.push('/ai/topics');
                    // }}
                    // containerClassName="flex-col"
                    // showCloseButton={true}
                    // closeButtonHandler={() => {
                    //     showEndingSessionLoader.set(false);
                    // }}
                />
            )}

            {loading && <AiChatLoading contractUri={contractUri} />}

            {!loading && (
                <>
                    <div
                        ref={chatContainerRef}
                        className="flex-1 pt-[100px] sm:pt-0 overflow-y-auto flex flex-col px-4 relative"
                    >
                        <div
                            ref={chatInnerScrollRef}
                            className="flex flex-col transition-transform duration-300 ease-out"
                            style={{ paddingBottom: `${scrollOffset}px` }}
                        >
                            {messagesToShow.map((msg, index) => {
                                return (
                                    <div
                                        ref={el => (messageRefs.current[index] = el)}
                                        key={index}
                                        className="w-full"
                                    >
                                        <MessageWithQuestions message={msg} />
                                        {index < messagesToShow.length - 1 &&
                                            msg.role === 'assistant' &&
                                            messagesToShow[index + 1].role === 'assistant' && (
                                                <hr className="border-black w-full my-4" />
                                            )}

                                        {typing && index === messagesToShow.length - 1 && (
                                            <div className="py-4 px-2 rounded-lg mb-4 flex items-center gap-2">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                        style={{ animationDelay: '0.2s' }}
                                                    ></div>
                                                    <div
                                                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                        style={{ animationDelay: '0.4s' }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div ref={messagesEndRef} />

                        {!isAtBottom && (
                            <button
                                onClick={() => {
                                    // setScrollOffset(0);
                                    setScrollToBottomSmooth(true);
                                }}
                                className="sticky bottom-[20px] left-1/2 transform -translate-x-1/2 p-[11px] bg-white rounded-full border-solid border-[1px] border-grayscale-200 w-fit shadow-button-bottom text-grayscale-900"
                            >
                                <CaretDown version="2" />
                            </button>
                        )}
                    </div>

                    <div className="sm:px-4">{!loading && <ChatInput />}</div>
                </>
            )}
        </div>
    );
};

export default LearnCardAiChatBot;
