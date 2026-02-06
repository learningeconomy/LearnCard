import { atom } from 'nanostores';
import type { ChatMessage, Thread, LearningPathway } from '../../types/ai-chat';
import { auth } from './authStore';
import { showErrorModal } from './ErrorModalStore';
import { showToast } from './toastStore';
import { LEARNCARD_AI_URL } from '../../constants/Networks';

export const messages = atom<ChatMessage[]>([]);
export const threads = atom<Thread[]>([]);
export const currentThreadId = atom<string | null>(null);
export const isTyping = atom(false);
export const isLoading = atom(false);
export const isEndingSession = atom(false);
export const showEndingSessionLoader = atom(false);
export const activeQuestions = atom<string[]>([]);
export const suggestedTopics = atom<string[]>([]);
export const topicCredentials = atom<TopicCredential[]>([]);
export const sessionEnded = atom(false);
export const planReady = atom(false);
export const planReadyThread = atom<string | null>(null);

// Plan streaming state
export const planStreamActive = atom(false);
export const planMetadata = atom<{
    sections: {
        title: string;
        objectives: number;
        skills: number;
        roadmap: number;
    };
} | null>({
    sections: {
        title: '',
        objectives: 0,
        skills: 0,
        roadmap: 0,
    },
});
export const planSections = atom({
    welcome: '',
    summary: '',
    objectives: [] as string[],
    skills: [] as string[],
    roadmap: [] as any[],
});

export const BACKEND_URL = LEARNCARD_AI_URL;

/**
 * Reset all chat-related stores to their initial values.
 * Useful when starting a new session or logging out.
 */
export function resetChatStores() {
    messages.set([]);
    threads.set([]);
    currentThreadId.set(null);
    isTyping.set(false);
    isLoading.set(false);
    isEndingSession.set(false);
    showEndingSessionLoader.set(false);
    activeQuestions.set([]);
    suggestedTopics.set([]);
    topicCredentials.set([]);
    sessionEnded.set(false);
    planReady.set(false);
    planReadyThread.set(null);
    planStreamActive.set(false);
    planMetadata.set({
        sections: {
            title: '',
            objectives: 0,
            skills: 0,
            roadmap: 0,
        },
    });
    planSections.set({
        welcome: '',
        summary: '',
        objectives: [],
        skills: [],
        roadmap: [],
    });
}

interface TopicCredential {
    uri: string;
    type: string;
    context: string;
    score: number;
    title: string;
}

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let messageListeners: ((message: any) => void)[] = [];
let readyListeners: (() => void)[] = [];
let shouldReconnect = true;

// Load user's threads
export async function loadThreads() {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${BACKEND_URL}/threads?did=${did}`);
        if (!response.ok) throw new Error('Failed to load threads');

        const threadList = await response.json();
        threads.set(threadList);
    } catch (error) {
        console.error('Error loading threads:', error);
    }
}

// Load messages for a specific thread
export async function loadThread(threadId: string) {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${BACKEND_URL}/messages?did=${did}&threadId=${threadId}`);
        if (!response.ok) throw new Error('Failed to load messages');

        const threadMessages = await response.json();
        messages.set(threadMessages);
        currentThreadId.set(threadId);

        // Reset active questions when loading a thread
        activeQuestions.set([]);

        // Determine lock state based on presence of summaries
        // First check the current threads store, then reload if needed
        let loadedThread = threads.get().find(t => t.id === threadId);
        if (!loadedThread) {
            // If thread not found in store, reload threads to get latest data
            await loadThreads();
            loadedThread = threads.get().find(t => t.id === threadId);
        }

        const hasSessionEnded = !!loadedThread?.summaries?.length;
        sessionEnded.set(hasSessionEnded);

        console.debug(
            `Thread ${threadId} session ended: ${hasSessionEnded}, summaries:`,
            loadedThread?.summaries?.length
        );

        // Load thread credentials
        const credsResponse = await fetch(
            `${BACKEND_URL}/thread_credentials?did=${did}&threadId=${threadId}`
        );
        if (!credsResponse.ok) {
            console.error('Failed to load thread credentials');
            topicCredentials.set([]);
        } else {
            const credsData: TopicCredential[] = await credsResponse.json();
            topicCredentials.set(credsData);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Create a new thread
export async function createThread() {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${BACKEND_URL}/threads?did=${did}`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to create thread');

        const { threadId } = await response.json();
        messages.set([]);
        currentThreadId.set(threadId);
        activeQuestions.set([]);
        // New thread is unlocked initially
        sessionEnded.set(false);
        await loadThreads();
        return threadId;
    } catch (error) {
        console.error('Error creating thread:', error);
    }
}

// Delete a thread
export async function deleteThread(threadId: string) {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${BACKEND_URL}/threads?did=${did}&threadId=${threadId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete thread');

        if (currentThreadId.get() === threadId) {
            currentThreadId.set(null);
            messages.set([]);
            activeQuestions.set([]);
        }

        await loadThreads();
    } catch (error) {
        console.error('Error deleting thread:', error);
    }
}

// Fetch learning pathways for a thread
export async function fetchLearningPathways(threadId: string): Promise<LearningPathway[]> {
    const { did } = auth.get();
    if (!did) {
        console.error('Authentication required to fetch learning pathways');
        return [];
    }

    try {
        const response = await fetch(
            `${BACKEND_URL}/learning-pathways?did=${encodeURIComponent(
                did
            )}&threadId=${encodeURIComponent(threadId)}`
        );

        if (response.ok) {
            const data = await response.json();
            return data.pathways || [];
        } else {
            console.error('Failed to fetch learning pathways:', response.statusText);
            return [];
        }
    } catch (error) {
        console.error('Error fetching learning pathways:', error);
        return [];
    }
}

export function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))
        return ws;

    const { did } = auth.get();
    if (!did) throw new Error('Authentication required');

    shouldReconnect = true;

    const wsUrl = BACKEND_URL.replace(/^http/, 'ws');
    const threadIdQuery = currentThreadId.get() ? `&threadId=${currentThreadId.get()}` : '';

    ws = new WebSocket(`${wsUrl}?did=${did}${threadIdQuery}`);
    const socket = ws;

    ws.onmessage = event => {
        if (ws !== socket) return;

        try {
            const data = JSON.parse(event.data);

            if (data.event === 'no_conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);
                return;
            }

            if (data.event === 'credentials_for_topic' && Array.isArray(data.credentials)) {
                topicCredentials.set(data.credentials);
                return;
            }

            if (data.event === 'credentials_ready') {
                if (Array.isArray(data.suggestedTopics)) {
                    suggestedTopics.set(data.suggestedTopics);
                }
                return;
            }

            if (data.event === 'vc_issued') {
                showToast.set(true);
                setTimeout(() => showToast.set(false), 5000);
                return;
            }

            /* -------------------------------------------------- */
            /* PLAN STREAMING (STRUCTURED)                       */
            /* -------------------------------------------------- */

            if (data.event === 'plan_stream_start') {
                planStreamActive.set(true);
                planMetadata.set(null);
                planSections.set({
                    welcome: '',
                    summary: '',
                    objectives: [],
                    skills: [],
                    roadmap: [],
                });
                return;
            }

            if (data.event === 'plan_metadata') {
                planMetadata.set(data.sections ?? null);
                return;
            }

            if (data.event === 'plan_section') {
                const index = typeof data.index === 'number' ? data.index : undefined;

                const prev = planSections.get();
                const next = { ...prev };

                switch (data.section) {
                    case 'welcome':
                        next.welcome += data.delta;
                        break;

                    case 'summary':
                        next.summary += data.delta;
                        break;

                    case 'objectives': {
                        const arr = [...next.objectives];
                        arr[index ?? arr.length] = data.delta;
                        next.objectives = arr;
                        break;
                    }

                    case 'skills': {
                        const arr = [...next.skills];
                        arr[index ?? arr.length] = data.delta;
                        next.skills = arr;
                        break;
                    }

                    case 'roadmap': {
                        const arr = [...next.roadmap];
                        arr[index ?? arr.length] = data.delta;
                        next.roadmap = arr;
                        break;
                    }
                }

                planSections.set(next);

                return;
            }

            if (data.event === 'plan_stream_end') {
                planStreamActive.set(false);
                return;
            }

            /* -------------------------------------------------- */
            /* FORMATTED STREAMING (MARKDOWN MODE)               */
            /* -------------------------------------------------- */

            if (data.event === 'plan_stream') {
                const current = messages.get();
                const last = current[current.length - 1];

                if (last?.role === 'assistant') {
                    messages.set([
                        ...current.slice(0, -1),
                        { ...last, content: last.content + data.delta },
                    ]);
                } else {
                    messages.set([...current, { role: 'assistant', content: data.delta }]);
                }

                return;
            }

            /* -------------------------------------------------- */
            /* PLAN LIFECYCLE                                    */
            /* -------------------------------------------------- */

            if (data.event === 'plan_intro') {
                planStreamActive.set(false);
                isTyping.set(false);
                isLoading.set(false);
                return;
            }

            if (data.event === 'plan_ready') {
                isTyping.set(false);
                isLoading.set(false);
                planReady.set(true);
                planReadyThread.set(data.threadId);
                currentThreadId.set(data.threadId);

                if (data.title) {
                    const list = threads.get();
                    const idx = list.findIndex(t => t.id === data.threadId);

                    if (idx > -1) {
                        const copy = [...list];
                        copy[idx].title = data.title;
                        threads.set(copy);
                    } else {
                        threads.set([
                            {
                                id: data.threadId,
                                did: auth.get().did!,
                                title: data.title,
                                created_at: new Date().toISOString(),
                                last_message_at: new Date().toISOString(),
                            },
                            ...list,
                        ]);
                    }
                }
                return;
            }

            /* -------------------------------------------------- */
            /* CONVERSATION SUMMARY                              */
            /* -------------------------------------------------- */

            if (data.event === 'conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);

                if (data.threadId && data.credentialUri) {
                    const summary = {
                        summary_data: JSON.stringify(data.summary),
                        credential_uri: data.credentialUri,
                        created_at: new Date().toISOString(),
                    };

                    threads.set(
                        threads
                            .get()
                            .map(t =>
                                t.id === data.threadId
                                    ? { ...t, summaries: [...(t.summaries || []), summary] }
                                    : t
                            )
                    );
                }
                return;
            }

            /* -------------------------------------------------- */
            /* DEBUG                                             */
            /* -------------------------------------------------- */

            if (data.event === 'debug') {
                console.debug(`[Mongo] ${data.data.collection}`, data.data);
                return;
            }

            // Handle session completed event
            if (data.event === 'session_completed') {
                console.debug('Session already completed for this thread');
                sessionEnded.set(true);
                isTyping.set(false);
                return;
            }

            if (data.error) {
                console.error('Error:', data.error);
                isTyping.set(false);
                return;
            }

            /* -------------------------------------------------- */
            /* STRUCTURED TOOL RESPONSE                          */
            /* -------------------------------------------------- */

            if (data.assistantMessage) {
                const { questions } = JSON.parse(
                    data.assistantMessage.tool_calls?.[0]?.function?.arguments
                );

                const currentMessages = messages.get();
                messages.set([
                    ...currentMessages.filter(
                        (msg, idx, arr) =>
                            !(
                                idx === arr.length - 1 &&
                                msg.role === 'assistant' &&
                                msg.tool_calls?.[0]?.function?.name === 'structuredResponse'
                            )
                    ),
                    data.assistantMessage,
                ]);

                activeQuestions.set(questions);
                isTyping.set(false);

                if (data.threadId && data.title) {
                    const list = threads.get();
                    const idx = list.findIndex(t => t.id === data.threadId);

                    if (idx > -1) {
                        const copy = [...list];
                        copy[idx].title = data.title;
                        threads.set(copy);
                    } else {
                        threads.set([
                            {
                                id: data.threadId,
                                did,
                                title: data.title,
                                created_at: new Date().toISOString(),
                                last_message_at: new Date().toISOString(),
                            },
                            ...list,
                        ]);
                    }
                }
                return;
            }

            if (data.done) {
                isTyping.set(false);

                // Handle thread creation and title updates
                if (data.threadId) {
                    currentThreadId.set(data.threadId);
                    if (data.title) {
                        // Update threads list with new thread
                        const currentThreads = threads.get();
                        const currentThreadIndex = currentThreads.findIndex(
                            t => t.id === data.threadId
                        );

                        if (currentThreadIndex > -1) {
                            const newThreads = [...currentThreads];
                            newThreads[currentThreadIndex].title = data.title;
                            threads.set(newThreads);
                        } else {
                            threads.set([
                                {
                                    id: data.threadId,
                                    did: did,
                                    title: data.title,
                                    created_at: new Date().toISOString(),
                                    last_message_at: new Date().toISOString(),
                                },
                                ...currentThreads,
                            ]);
                        }
                    } else {
                        loadThreads();
                    }
                }
                return;
            }

            /* -------------------------------------------------- */
            /* LEGACY STREAM (STRING)                            */
            /* -------------------------------------------------- */

            if (typeof data === 'string') {
                const current = messages.get();
                const last = current[current.length - 1];

                if (last?.role === 'assistant') {
                    messages.set([
                        ...current.slice(0, -1),
                        { ...last, content: last.content + data },
                    ]);
                } else {
                    messages.set([...current, { role: 'assistant', content: data }]);
                }

                isLoading.set(false);
            }
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    };

    ws.onopen = () => {
        if (ws !== socket) return;
        reconnectAttempts = 0;
        readyListeners.forEach(fn => fn());
        readyListeners = [];
    };

    ws.onclose = () => {
        if (ws !== socket) return;

        isTyping.set(false);
        isLoading.set(false);
        ws = null;

        const shouldTryReconnect = shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS;

        if (shouldTryReconnect) {
            reconnectAttempts++;
            setTimeout(connectWebSocket, 1000);
        }
    };

    ws.onerror = err => {
        if (ws !== socket) return;
        console.error('WebSocket error:', err);
    };

    return ws;
}

// Function to send message in response to a selected question
export function sendMessageWithQuestion(content: string, selectedQuestion?: string) {
    if (!content.trim()) return;

    // Check if session has ended before sending message
    const thread = threads.get().find(t => t.id === currentThreadId.get());
    if (thread?.summaries?.length) {
        console.warn('Cannot send message: session has already ended');
        sessionEnded.set(true);
        return;
    }

    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        setTimeout(() => sendMessageWithQuestion(content, selectedQuestion), 100);
        return;
    }

    const currentMessages = messages.get();
    let newMessage: ChatMessage;

    // If responding to a specific question, we need to format this as a tool response
    if (selectedQuestion) {
        // Find the latest assistant message with tool calls
        const lastAssistantMessage = [...currentMessages]
            .reverse()
            .find(msg => msg.role === 'assistant' && msg.tool_calls);

        if (lastAssistantMessage?.tool_calls) {
            currentMessages.push({
                role: 'tool',
                content: selectedQuestion,
                tool_call_id: lastAssistantMessage.tool_calls[0].id,
            });
        }
        // Fallback if we can't find the tool call (shouldn't happen)
        newMessage = {
            role: 'user',
            content,
        };
    } else {
        // Regular user message
        newMessage = {
            role: 'user',
            content,
        };
    }

    const updatedMessages = [...currentMessages, newMessage];
    messages.set(updatedMessages);

    // Clear active questions once user responds
    activeQuestions.set([]);

    isTyping.set(true);

    const { did } = auth.get();
    const threadId = currentThreadId.get();

    // If this is the first message, create a temporary title
    if (updatedMessages.length === 1) {
        const tempTitle = content.length > 30 ? content.substring(0, 27) + '...' : content;

        // Update threads list with temporary title
        const currentThreads = threads.get();
        if (threadId) {
            const currentThreadIndex = currentThreads.findIndex(t => t.id === threadId);

            if (currentThreadIndex > -1) {
                currentThreads[currentThreadIndex].title = tempTitle;
                threads.set(currentThreads);
            } else {
                threads.set([
                    {
                        id: threadId,
                        did: did!,
                        title: tempTitle,
                        created_at: new Date().toISOString(),
                        last_message_at: new Date().toISOString(),
                    },
                    ...currentThreads,
                ]);
            }
        }
    }

    socket.send(
        JSON.stringify({
            message: newMessage,
            threadId,
            selectedQuestion,
        })
    );
}

// Maintain backward compatibility
export function sendMessage(content: string) {
    sendMessageWithQuestion(content);
}

// Function to start a new topic using a topic URI
export async function startTopicWithUri(topicUri: string) {
    isTyping.set(true);
    isLoading.set(true);
    planReady.set(false);
    planReadyThread.set(null);
    messages.set([]);
    activeQuestions.set([]);
    sessionEnded.set(false);

    const { did } = auth.get();
    if (!did) {
        console.error('Authentication required to start a topic with URI.');
        isTyping.set(false);
        isLoading.set(false);
        showErrorModal('Authentication Required', 'Please sign in to start a topic with a URI.');
        return;
    }

    // Reset WebSocket and clear current thread to avoid restoring old session
    disconnectWebSocket();
    currentThreadId.set(null);

    // Ensure WebSocket connection is established
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            await new Promise<void>((resolve, reject) => {
                connectWebSocket(); // Attempt to connect or reconnect
                onReady(resolve);
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });
        } catch (error) {
            console.error('WebSocket connection failed, cannot start topic with URI:', error);
            isTyping.set(false);
            isLoading.set(false);
            showErrorModal(
                'Connection Error',
                'Could not connect to the chat service. Please try again later.'
            );
            return;
        }
    }

    // Send the start_topic_uri message
    const messageToSend = {
        action: 'start_topic_uri',
        topicUri,
        did,
    };

    // Ensure WebSocket is ready before sending - retry if needed
    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageToSend));
        } else {
            setTimeout(sendMessage, 100);
        }
    };
    sendMessage();
}

// Function to start a new learning pathway with topic and pathway URIs
export async function startLearningPathway(topicUri: string, pathwayUri: string) {
    isTyping.set(true);
    isLoading.set(true);
    planReady.set(false);
    planReadyThread.set(null);
    messages.set([]);
    activeQuestions.set([]);
    sessionEnded.set(false);

    const { did } = auth.get();
    if (!did) {
        console.error('Authentication required to start a learning pathway.');
        isTyping.set(false);
        isLoading.set(false);
        showErrorModal('Authentication Required', 'Please sign in to start a learning pathway.');
        return;
    }

    // Reset WebSocket and clear current thread to avoid restoring old session
    disconnectWebSocket();
    currentThreadId.set(null);

    // Ensure WebSocket connection is established
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            await new Promise<void>((resolve, reject) => {
                connectWebSocket(); // Attempt to connect or reconnect
                onReady(resolve);
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });
        } catch (error) {
            console.error('WebSocket connection failed, cannot start learning pathway:', error);
            isTyping.set(false);
            isLoading.set(false);
            showErrorModal(
                'Connection Error',
                'Could not connect to the chat service. Please try again later.'
            );
            return;
        }
    }

    // Send the start_learning_pathway message with both URIs
    const messageToSend = {
        action: 'start_learning_pathway',
        topicUri,
        pathwayUri,
        did,
    };

    // Ensure WebSocket is ready before sending - retry if needed
    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageToSend));
        } else {
            setTimeout(sendMessage, 100);
        }
    };
    sendMessage();
}

// Function to initiate a new session plan for a topic
export async function startTopic(topic: string) {
    isTyping.set(true);
    isLoading.set(true);
    planReady.set(false);
    planReadyThread.set(null);
    messages.set([]);
    activeQuestions.set([]);
    sessionEnded.set(false); // New topic implies a new, active session initially

    const { did } = auth.get();

    if (!did) {
        console.error('Authentication required to start a topic.');
        isTyping.set(false);
        isLoading.set(false);
        return;
    }

    try {
        const activeSessionRes = await fetch(
            `${BACKEND_URL}/api/chat/active-session-status?did=${did}`
        );
        if (!activeSessionRes.ok) {
            console.error('Failed to check active session status:', activeSessionRes.statusText);
            // Potentially allow proceeding, or show a more specific error to the user.
            // For now, we'll log and proceed cautiously.
        } else {
            const activeSessionData = await activeSessionRes.json();
            const _currentKnownThreadId = currentThreadId.get();

            // ! bypass confirmation modal for now
            // if (
            //     activeSessionData.isActive &&
            //     activeSessionData.activeThreadId &&
            //     activeSessionData.activeThreadId !== currentKnownThreadId
            // ) {
            //     const userConfirmation = await showConfirmationModal(
            //         `You have an active chat session titled "${
            //             activeSessionData.activeThreadTitle || 'Untitled'
            //         }".\n\nStarting a new topic will end this session. Do you want to proceed?`
            //     );

            //     if (!userConfirmation) {
            //         isTyping.set(false);
            //         isLoading.set(false);
            //         if (activeSessionData.activeThreadId) {
            //             console.log(
            //                 `User cancelled. Redirecting to active session: ${activeSessionData.activeThreadId}`
            //             );
            //             currentThreadId.set(activeSessionData.activeThreadId);
            //             // Explicitly load the thread data for the active session
            //             await loadThread(activeSessionData.activeThreadId);
            //             // Potentially clear any UI input for the new topic here
            //         }
            //         return;
            //     } else {
            //         // User confirmed to end the old session and start a new one
            //         fetch(`${BACKEND_URL}/threads/finish?did=${did}`, {
            //             method: 'POST',
            //             headers: {
            //                 'Content-Type': 'application/json',
            //             },
            //             body: JSON.stringify({
            //                 did: did,
            //                 threadId: activeSessionData.activeThreadId,
            //                 sendSummary: false,
            //             }),
            //         });
            //     }
            // }

            fetch(`${BACKEND_URL}/threads/finish?did=${did}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    did: did,
                    threadId: activeSessionData.activeThreadId,
                    sendSummary: false,
                }),
            });
        }
    } catch (error) {
        console.error('Error checking active session status:', error);
        // Decide if to proceed or block. For now, log and proceed.
    }

    // Reset WebSocket to avoid overlapping streams when starting a new topic
    disconnectWebSocket();

    // Ensure WebSocket is connected before sending message
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            connectWebSocket(); // Attempt to connect or reconnect
            await new Promise<void>((resolve, reject) => {
                onReady(resolve); // Wait for WebSocket to be ready
                // Add a timeout in case connection fails indefinitely
                setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
            });
        } catch (error) {
            console.error('WebSocket connection failed, cannot start topic:', error);
            isTyping.set(false);
            isLoading.set(false);
            // Optionally, show an error message to the user
            alert('Could not connect to the chat service. Please try again later.');
            return;
        }
    }

    // Clear current thread ID before starting a new topic, backend will assign a new one.
    // However, the backend handles creating/assigning threadId upon 'start_topic' or first message.
    // Let's ensure frontend state reflects expectation of a new session, if not already handled.
    // currentThreadId.set(null); // This might be too aggressive if backend reuses thread for a new plan on same ID.
    // The backend should handle thread finalization if a new 'start_topic' arrives for a DID with an existing active thread.

    const messageToSend = {
        action: 'start_topic',
        topic,
        introStreamMode: 'structured',
        did, // Include DID for backend processing
    };

    // Ensure WebSocket is ready before sending - retry if needed
    const sendMessage = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageToSend));
        } else {
            setTimeout(sendMessage, 100);
        }
    };
    sendMessage();
}

// Function to continue after plan introduction
export function continuePlan() {
    const threadId = planReadyThread.get();
    if (!threadId) return;
    // Add placeholder for continuation streaming to a new assistant message
    const currentMsgs = messages.get();
    messages.set([...currentMsgs, { role: 'assistant', content: '' }]);
    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        onReady(() => continuePlan());
        return;
    }
    isTyping.set(true);
    socket.send(JSON.stringify({ action: 'continue_plan', threadId }));
    planReady.set(false);
    planReadyThread.set(null);
}

// Function to finish a session immediately
export async function finishSession(onSuccess?: () => void) {
    const { did } = auth.get();
    const threadId = currentThreadId.get();
    if (!did || !threadId) return;

    try {
        isEndingSession.set(true);
        showEndingSessionLoader.set(true);
        messages.set([
            ...messages.get(),
            { role: 'user', content: 'Finish Session' },
            { role: 'assistant', content: '' },
        ]);
        sessionEnded.set(true);

        const res = await fetch(`${BACKEND_URL}/threads/finish?did=${did}`, {
            method: 'POST',
            body: JSON.stringify({ threadId, did }),
        });

        // In most cases the summary will come through the existing WebSocket
        // listener as a `conversation_summary` event. However, if the WS is not
        // connected, the backend includes the summary payload directly in the
        // response – handle that case here by emulating the WS event handler.
        if (res.ok) {
            const data = await res.json();
            if (data.event === 'conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);
            } else if (data.event === 'no_conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);
            }

            // If backend provided a final congrats message in HTTP payload, fill the
            // placeholder assistant message we added earlier.
            if (data.finalMessage && typeof data.finalMessage === 'string') {
                const current = messages.get();
                if (current.length && current[current.length - 1]?.role === 'assistant') {
                    const updated = [...current];
                    updated[updated.length - 1] = {
                        ...updated[updated.length - 1],
                        content: data.finalMessage,
                    };
                    messages.set(updated);
                } else {
                    messages.set([...current, { role: 'assistant', content: data.finalMessage }]);
                }
                isTyping.set(false);
                sessionEnded.set(true);
            }
        }
        isEndingSession.set(false);
        showEndingSessionLoader.set(false);
        onSuccess?.();
    } catch (err) {
        isEndingSession.set(false);
        showEndingSessionLoader.set(false);
        console.error('Error finishing session: ', err);
    }
}

// Function to subscribe to incoming messages
export function subscribeToMessages(listener: (message: any) => void) {
    messageListeners.push(listener);
    // Return an unsubscribe function
    return () => {
        messageListeners = messageListeners.filter(l => l !== listener);
    };
}

// Function to get the WebSocket instance (use with caution)
export function getWebSocket() {
    return ws;
}

// Gracefully close the WebSocket and prevent auto-reconnect
export function disconnectWebSocket() {
    shouldReconnect = false;
    if (ws) {
        try {
            ws.close();
        } catch (e) {
            console.error('WebSocket close error:', e);
        }
        ws = null;
    }
}

// Function to register a callback for when WebSocket is ready
export function onReady(listener: () => void) {
    // Check if ws exists and is open
    if (ws?.readyState === WebSocket.OPEN) {
        listener(); // Run immediately if already ready
    } else {
        readyListeners.push(listener);
    }
    // Return an unsubscribe function
    return () => {
        readyListeners = readyListeners.filter(l => l !== listener);
    };
}

currentThreadId.listen(threadId => {
    if (threadId) {
        const url = new URL(window.location.href);
        url.searchParams.set('threadId', threadId);
        window.history.replaceState({}, '', url);
    }
});
