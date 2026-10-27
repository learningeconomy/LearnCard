import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
    messages,
    isTyping,
    startTopic,
    startTopicWithUri,
    startLearningPathway,
    currentThreadId,
    isLoading,
    credentialPreloadUnavailable,
} from '../stores/chatStore';
import { auth, authenticatedFetch } from '../stores/authStore';
import { MessageWithQuestions } from './MessageWithQuestions';
import ChatInput from './ChatInput';
import { DebugPanel } from './DebugPanel';
import type { ChatMessage } from '@learncard/types';
import LoadingAnimation from '../assets/purple-sparkles.gif';
import TypingIndicator from './TypingIndicator';

type ChatInterfaceProps = {
    initialMessages: ChatMessage[];
    initialTopic?: string | undefined;
    initialTopicUri?: string | undefined;
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    initialMessages = [],
    initialTopic = undefined,
    initialTopicUri = undefined,
}) => {
    const [showInitialMessages, setShowInitialMessages] = useState(true);
    const [topicInitialized, setTopicInitialized] = useState(initialMessages.length > 0);
    const allMessages = useStore(messages);
    const typing = useStore(isTyping);
    const loading = useStore(isLoading);
    const preloadUnavailable = useStore(credentialPreloadUnavailable);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastScrollTimeRef = useRef<number>(0);

    // Scroll to bottom whenever messages change (throttled)
    useEffect(() => {
        const now = Date.now();
        if (now - lastScrollTimeRef.current > 100) {
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
            lastScrollTimeRef.current = now;
        }
    }, [allMessages]);

    // Handle initial topic or topicUri when component mounts
    useEffect(() => {
        console.log('initialTopicUri', initialTopicUri);
        console.log('initialTopic', initialTopic);
        const initializeTopic = async () => {
            if (initialTopicUri && !topicInitialized) {
                setTopicInitialized(true);
                const urlParams = new URLSearchParams(window.location.search);
                const pathwayUri = urlParams.get('pathwayUri');

                if (pathwayUri) {
                    startLearningPathway(initialTopicUri, pathwayUri);
                } else {
                    startTopicWithUri(initialTopicUri);
                }
            } else if (initialTopic && !topicInitialized) {
                setTopicInitialized(true);
                startTopic(initialTopic);
            }
        };
        initializeTopic();
    }, [initialTopic, initialTopicUri, topicInitialized]);

    // notify backend on visibility change (hidden/visible) for session management
    // Only trigger after being hidden for a substantial period to avoid brief tab switches
    useEffect(() => {
        let hiddenTimer: NodeJS.Timeout | null = null;

        const handleVisibility = () => {
            const threadId = currentThreadId.get();
            const { did } = auth.get();
            console.log('visibility change', document.visibilityState, threadId, did);

            if (threadId && did) {
                if (document.visibilityState === 'hidden') {
                    // Only send "hidden" event after being hidden for 5 minutes
                    // This prevents brief tab switches from triggering auto-summary
                    // Also, only set the timer if one is not already running to prevent leaks.
                    if (!hiddenTimer) {
                        hiddenTimer = setTimeout(
                            () => {
                                const form = new FormData();
                                form.append('threadId', threadId);
                                form.append('event', 'hidden');
                                void authenticatedFetch('/threads/visibility', {
                                    method: 'POST',
                                    body: form,
                                    keepalive: true,
                                }).catch(error =>
                                    console.error('Failed to report hidden visibility:', error)
                                );
                                console.log('reported hidden visibility after 5min');
                                hiddenTimer = null;
                            },
                            5 * 60 * 1000
                        ); // 5 minutes
                    }
                } else if (document.visibilityState === 'visible') {
                    // Cancel the hidden timer if user comes back
                    if (hiddenTimer) {
                        clearTimeout(hiddenTimer);
                        hiddenTimer = null;
                    }
                    // Send visible event immediately to cancel any existing timers
                    const form = new FormData();
                    form.append('threadId', threadId);
                    form.append('event', 'visible');
                    void authenticatedFetch('/threads/visibility', {
                        method: 'POST',
                        body: form,
                        keepalive: true,
                    }).catch(error => console.error('Failed to report visible visibility:', error));
                    console.log('reported visible visibility');
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

    useEffect(() => {
        if (initialMessages?.length > 0) messages.set(initialMessages);
        setShowInitialMessages(false);
    }, [initialMessages]);

    const messagesToShow = (showInitialMessages ? initialMessages : allMessages) ?? [];

    return (
        <div className="flex flex-col h-full min-h-[32rem] w-full max-w-[829px] mx-auto sm:pb-[30px]">
            <div className="flex-1 pt-16 sm:pt-0 pb-2 overflow-y-auto flex flex-col px-4 relative">
                {messagesToShow.map((msg, index) => (
                    <div key={index} className="w-full">
                        <MessageWithQuestions message={msg} />
                        {index < messagesToShow.length - 1 &&
                            msg.role === 'assistant' &&
                            messagesToShow[index + 1].role === 'assistant' && (
                                <hr className="border-black w-full my-4" />
                            )}
                    </div>
                ))}
                {typing && (
                    <div className="py-4 px-2 rounded-lg mb-4 flex items-center gap-2">
                        <TypingIndicator />
                    </div>
                )}
                {loading && (
                    <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                        <img {...LoadingAnimation} alt="Loading" />
                        <p className="text-gray-400">Thinking...</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="sm:px-4">
                {preloadUnavailable && (
                    <p
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="mx-4 mb-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900 sm:mx-0"
                    >
                        Personalized suggestions are unavailable. You can still chat.
                    </p>
                )}
                <ChatInput />
            </div>
            <DebugPanel />
        </div>
    );
};

export default ChatInterface;
