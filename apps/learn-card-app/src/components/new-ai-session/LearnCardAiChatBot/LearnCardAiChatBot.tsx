import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { useDeviceTypeByWidth, useKeyboardHeight, isPlatformIOS } from 'learn-card-base';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import CaretDown from '../../svgs/CaretDown';
import AiChatLoading from './AiChatLoading';
import AiSessionPlan from './AiSessionPlan';
import AiSessionLoader from '../AiSessionLoader';
import { MessageWithQuestions, StreamingMessage } from './MessageWithQuestions';

import {
    messages,
    startTopic,
    startTopicWithUri,
    startLearningPathway,
    currentThreadId,
    isLoading,
    isEndingSession,
    showEndingSessionLoader,
    disconnectWebSocket,
    startInsightsSession,
    streamingMessage,
} from 'learn-card-base/stores/nanoStores/chatStore';
import { auth } from 'learn-card-base/stores/nanoStores/authStore';

import type { ChatMessage } from 'learn-card-base/types/ai-chat';

import { sessionWrapUpText, AiSessionMode } from '../newAiSession.helpers';
import {
    AiPassportAppContractUri,
    getAiPassportAppByContractUri,
} from '../../ai-passport-apps/aiPassport-apps.helpers';
import { AiFeatureGate } from '../../ai-feature-gate/AiFeatureGate';
import { useStickToBottom } from '../../../hooks/useStickToBottom';
import { preloadMarkdownRenderer } from '../../ai-assessment/AiAssessment/helpers/LazyMarkdownRenderer';

export const getBackendUrl = (): string => networkStore.get.aiServiceUrl();

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
    // iOS Capacitor's WebView resizes natively when the keyboard opens, so we
    // only manually offset on Android — same pattern as TopicInput.
    const kbHeight = useKeyboardHeight();
    const keyboardInset = isPlatformIOS() ? 0 : kbHeight;
    const aiApp = useMemo(() => getAiPassportAppByContractUri(contractUri), [contractUri]);
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
    const isEnding = useStore(isEndingSession);
    const showEndingLoader = useStore(showEndingSessionLoader);
    const loading = useStore(isLoading);
    const authState = useStore(auth);
    const streaming = useStore(streamingMessage);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const chatContentRef = useRef<HTMLDivElement>(null);
    // autoFollow: false — AI responses are long-form; the user should read
    // top-down from the pinned last-user-message, not be yanked to the bottom.
    const { isAtBottom, scrollToBottom } = useStickToBottom(chatContainerRef, {
        threshold: 64,
        contentRef: chatContentRef,
        autoFollow: false,
    });

    // Pin-user-message refs
    const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
    const prevUserCountRef = useRef(0);

    // Viewport height for min-height pin calculation
    const [viewportAllowance, setViewportAllowance] = useState(0);

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
                                `${getBackendUrl()}/threads/visibility?did=${did}`,
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
                    navigator.sendBeacon(`${getBackendUrl()}/threads/visibility?did=${did}`, form);
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

    // Warm the markdown renderer chunk before the first assistant token arrives,
    // so streaming doesn't flash the Suspense "Rendering…" fallback.
    useEffect(() => {
        preloadMarkdownRenderer();
    }, []);

    // Track viewport height for pin-user-message min-height
    useEffect(() => {
        const update = () => {
            if (chatContainerRef.current) {
                setViewportAllowance(chatContainerRef.current.clientHeight);
            }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
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

    const messagesToShow = (showInitialMessages ? initialMessages : allMessages) ?? [];

    const lastUserIdx = useMemo(() => {
        for (let i = messagesToShow.length - 1; i >= 0; i--) {
            if (messagesToShow[i].role === 'user') return i;
        }
        return -1;
    }, [messagesToShow]);

    // Pin user message to top of viewport when a new user message is sent.
    // The min-height style on the user bubble reserves viewport space so the
    // assistant reply can grow beneath it without the view moving.
    useEffect(() => {
        const userCount = messagesToShow.filter(m => m.role === 'user').length;
        if (userCount > prevUserCountRef.current) {
            prevUserCountRef.current = userCount;
            lastUserMessageRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
            prevUserCountRef.current = userCount;
        }
    }, [messagesToShow.length]);

    return (
        <AiFeatureGate>
        <div
            className="flex flex-col h-full min-h-[32rem] w-full bg-white"
            style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
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

            {loading && mode === AiSessionMode.insights && (
                <AiChatLoading contractUri={contractUri} />
            )}

            {(!loading || mode !== AiSessionMode.insights) && (
                <>
                    <ChatHeader mode={mode} aiApp={aiApp} initialTopic={initialTopic} />
                    <div className="flex flex-col flex-1 min-h-0 w-full max-w-[829px] mx-auto sm:pb-[30px]">
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto flex flex-col px-4 relative"
                    >
                        <div ref={chatContentRef} className="flex flex-col">
                            {mode !== AiSessionMode.insights && <AiSessionPlan />}

                            {messagesToShow.map((msg, index) => {
                                const isLastUser = index === lastUserIdx;
                                const isTail = index === messagesToShow.length - 1;
                                // Reserve viewport space on whatever is the last rendered block.
                                // When streaming, that's the StreamingMessage below; otherwise
                                // it's the tail message wrapper. Keeps the user bubble pinned
                                // to the top without creating a gap before the assistant reply.
                                const pinStyle =
                                    isTail && !streaming && viewportAllowance > 0
                                        ? {
                                              minHeight: `${Math.max(
                                                  0,
                                                  viewportAllowance - 24
                                              )}px`,
                                          }
                                        : undefined;

                                return (
                                    <div
                                        key={msg.id ?? index}
                                        ref={isLastUser ? lastUserMessageRef : undefined}
                                        className="w-full"
                                        style={pinStyle}
                                    >
                                        <MessageWithQuestions message={msg} aiApp={aiApp} />
                                    </div>
                                );
                            })}

                            {streaming && (
                                <div
                                    className="w-full"
                                    style={
                                        viewportAllowance > 0
                                            ? {
                                                  minHeight: `${Math.max(
                                                      0,
                                                      viewportAllowance - 24
                                                  )}px`,
                                              }
                                            : undefined
                                    }
                                >
                                    <StreamingMessage aiApp={aiApp} />
                                </div>
                            )}
                        </div>

                        {!isAtBottom && (
                            <button
                                onClick={() => scrollToBottom('smooth')}
                                className="sticky bottom-[20px] left-1/2 transform -translate-x-1/2 p-[11px] bg-white rounded-full border-solid border-[1px] border-grayscale-200 w-fit shadow-button-bottom text-grayscale-900"
                            >
                                <CaretDown version="2" />
                            </button>
                        )}
                    </div>

                    <div className="sm:px-4">{!loading && <ChatInput />}</div>
                    </div>
                </>
            )}
        </div>
        </AiFeatureGate>
    );
};

export default LearnCardAiChatBot;
