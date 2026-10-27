import { atom } from 'nanostores';
import type { ChatMessage, LearningPathway, Thread } from '@learncard/types';
import { auth, authenticatedFetch, onAuthChange } from './authStore';
import { BACKEND_URL } from '../constants/env';
import { showConfirmationModal } from './ConfirmationModalStore';
import { showErrorModal } from './ErrorModalStore';
import { showToast } from './toastStore';
import { addTimingEvent } from './debugStore';

export const messages = atom<ChatMessage[]>([]);
export const threads = atom<Thread[]>([]);
export const currentThreadId = atom<string | null>(null);
export const isTyping = atom(false);
export const isLoading = atom(false);
export const activeQuestions = atom<string[]>([]);
export const suggestedTopics = atom<string[]>([]);
export const credentialPreloadUnavailable = atom(false);
export const topicCredentials = atom<TopicCredential[]>([]);
export const sessionEnded = atom(false);
export const planReady = atom(false);
export const planReadyThread = atom<string | null>(null);

type TopicCredential = {
    uri: string;
    type: string;
    context: string;
    score: number;
    title: string;
};

type ReadyListener = {
    cancel: (error: Error) => void;
    ready: () => void;
};

let ws: WebSocket | null = null;
let socketConnection: Promise<void> | null = null;
let socketDid: string | null = null;
let socketGeneration = 0;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let messageListeners: ((message: any) => void)[] = [];
let readyListeners: ReadyListener[] = [];

const cancelReadyListeners = (error: Error): void => {
    const listeners = readyListeners;

    readyListeners = [];
    listeners.forEach(({ cancel }) => cancel(error));
};
onAuthChange(() => disconnectWebSocket());

// Load user's threads
export async function loadThreads() {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await authenticatedFetch('/threads');
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
        const response = await authenticatedFetch(
            `/messages?threadId=${encodeURIComponent(threadId)}`
        );
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

        console.log(
            `Thread ${threadId} session ended: ${hasSessionEnded}, summaries:`,
            loadedThread?.summaries?.length
        );

        // Load thread credentials
        const credsResponse = await authenticatedFetch(
            `/thread_credentials?threadId=${encodeURIComponent(threadId)}`
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
        const response = await authenticatedFetch('/threads', {
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
        const response = await authenticatedFetch(
            `/threads?threadId=${encodeURIComponent(threadId)}`,
            {
                method: 'DELETE',
            }
        );

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
        return [];
    }

    try {
        const response = await authenticatedFetch(
            `/learning-pathways?threadId=${encodeURIComponent(threadId)}`
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

export function connectWebSocket(): WebSocket | null {
    const { did } = auth.get();

    if (!did) return null;

    if (
        ws &&
        socketDid === did &&
        (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)
    ) {
        return ws;
    }

    if (ws) disconnectWebSocket();

    if (!socketConnection) {
        const generation = socketGeneration;

        socketConnection = createWebSocket(did, generation)
            .catch(error => {
                console.error('WebSocket connection failed:', error);

                if (generation === socketGeneration) {
                    cancelReadyListeners(
                        error instanceof Error ? error : new Error('WebSocket connection failed')
                    );
                }
            })
            .finally(() => {
                if (generation === socketGeneration) socketConnection = null;
            });
    }

    return null;
}

export function disconnectWebSocket(): void {
    const socket = ws;

    socketGeneration += 1;
    socketConnection = null;
    socketDid = null;
    ws = null;
    cancelReadyListeners(new Error('WebSocket connection cancelled'));
    credentialPreloadUnavailable.set(false);
    isTyping.set(false);
    isLoading.set(false);
    socket?.close();
}

async function createWebSocket(did: string, generation: number): Promise<void> {
    const ticketResponse = await authenticatedFetch('/auth/websocket-ticket', {
        method: 'POST',
    });

    if (!ticketResponse.ok) {
        throw new Error(`WebSocket ticket request failed (${ticketResponse.status})`);
    }

    const { ticket } = (await ticketResponse.json()) as { ticket?: unknown };

    if (typeof ticket !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(ticket)) {
        throw new Error('WebSocket ticket response was invalid');
    }

    if (generation !== socketGeneration || auth.get().did !== did) return;

    // Convert http:// to ws:// or https:// to wss://
    const wsUrl = BACKEND_URL.replace(/^http/, 'ws');
    // Include threadId to restore session jobs
    const threadIdQuery = currentThreadId.get()
        ? `?threadId=${encodeURIComponent(currentThreadId.get() ?? '')}`
        : '';
    const socket = new WebSocket(`${wsUrl}${threadIdQuery}`, [
        'ai-passport',
        `ai-passport-ticket.${ticket}`,
    ]);

    ws = socket;
    socketDid = did;
    credentialPreloadUnavailable.set(false);

    socket.addEventListener('message', event => {
        try {
            const data = JSON.parse(event.data);

            if (data.event === 'timing' && data.data) {
                addTimingEvent(data.data);
                return;
            }

            // Handle credentials for topic event
            if (data.event === 'credentials_for_topic' && Array.isArray(data.credentials)) {
                topicCredentials.set(data.credentials);
                return;
            }

            // Handle no conversation summary event
            if (data.event === 'no_conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);
                // Optionally, we could surface a toast or UI note using data.reason
                return;
            }

            // Handle credential ready event
            if (data.event === 'credential_preload_error') {
                if (ws !== socket) return;
                credentialPreloadUnavailable.set(true);
                return;
            }

            if (data.event === 'credentials_ready') {
                if (ws !== socket) return;
                credentialPreloadUnavailable.set(false);
                // Update the suggestedTopics atom if topics are available
                if (data.suggestedTopics && Array.isArray(data.suggestedTopics)) {
                    suggestedTopics.set(data.suggestedTopics);
                }
                return;
            }

            if (data.event === 'vc_issued') {
                showToast.set(true);
                setTimeout(() => showToast.set(false), 5000);
            }

            // Handle plan introduction event
            if (data.event === 'plan_intro') {
                isTyping.set(false);
                isLoading.set(false);
                return;
            }

            // Handle plan ready event (after intro)
            if (data.event === 'plan_ready') {
                isTyping.set(false);
                isLoading.set(false);
                planReady.set(true);
                planReadyThread.set(data.threadId);
                currentThreadId.set(data.threadId);
                // Update threads list with new thread title
                if (data.title) {
                    const currentThreads = threads.get();
                    const idx = currentThreads.findIndex(t => t.id === data.threadId);
                    if (idx !== -1) {
                        currentThreads[idx].title = data.title;
                        threads.set(currentThreads);
                    } else {
                        threads.set([
                            {
                                id: data.threadId,
                                did: auth.get().did!,
                                title: data.title,
                                created_at: new Date().toISOString(),
                                last_message_at: new Date().toISOString(),
                            },
                            ...currentThreads,
                        ]);
                    }
                }
                return;
            }

            // Handle conversation summary event
            if (data.event === 'conversation_summary') {
                isTyping.set(false);
                sessionEnded.set(true);
                // Update threads store to include new summary
                if (data.threadId && data.credentialUri) {
                    const newSummary = {
                        summary_data: JSON.stringify(data.summary),
                        credential_uri: data.credentialUri,
                        created_at: new Date().toISOString(),
                    };
                    const updated = threads.get().map(t =>
                        t.id === data.threadId
                            ? {
                                  ...t,
                                  summaries: [...(t.summaries || []), newSummary],
                              }
                            : t
                    );
                    threads.set(updated);
                }
                // const {
                //   title,
                //   summary: sumText,
                //   learned,
                //   skills,
                //   nextSteps,
                // } = data.summary;
                // let content = `## ${title}\n\n${sumText}\n\n### What you learned\n`;
                // learned.forEach((item: string) => {
                //   content += `- ${item}\n`;
                // });
                // content += `\n### Skills\n`;
                // skills.forEach((s: any) => {
                //   content += `- **${s.title}**: ${s.description}\n`;
                // });
                // content += `\n### Next Steps\n`;
                // nextSteps.forEach((n: any) => {
                //   content += `- **${n.title}**: ${n.description}\n`;
                // });
                // messages.set([...messages.get(), { role: "assistant", content }]);
                return;
            }

            // Handle debug event
            if (data.event === 'debug') {
                console.group(`🔍 MongoDB Debug: ${data.data.operation}`);
                console.log(`Collection: ${data.data.collection}`);
                console.log(`Timestamp: ${data.data.timestamp}`);
                if (data.data.duration !== undefined) {
                    console.log(`Duration: ${data.data.duration}ms`);
                }
                if (data.data.input !== undefined) {
                    console.log('Input:', data.data.input);
                }
                if (data.data.output !== undefined) {
                    console.log('Output:', data.data.output);
                }
                console.groupEnd();
                return;
            }

            // Handle session completed event
            if (data.event === 'session_completed') {
                console.log('Session already completed for this thread');
                sessionEnded.set(true);
                isTyping.set(false);
                return;
            }

            if (data.error) {
                console.error('Error:', data.error);
                isTyping.set(false);
                return;
            }

            // Handle structured response
            if (data.assistantMessage) {
                const { questions } = JSON.parse(
                    data.assistantMessage.tool_calls?.[0]?.function?.arguments
                );

                // Get current messages, but exclude the last one if it's already this assistant message
                // (this can happen if the server sends multiple of these events)
                const currentMessages = messages.get().filter((msg, idx, arr) => {
                    if (
                        idx === arr.length - 1 &&
                        msg.role === 'assistant' &&
                        msg.tool_calls &&
                        msg.tool_calls[0]?.function?.name === 'structuredResponse'
                    ) {
                        return false;
                    }
                    return true;
                });

                // Add the assistant message with tool calls
                messages.set([...currentMessages, data.assistantMessage]);

                // Set active questions
                activeQuestions.set(questions);

                isTyping.set(false);

                // Handle thread creation and title updates
                if (data.threadId && data.title) {
                    // Update threads list with new thread
                    const currentThreads = threads.get();
                    const currentThreadIndex = currentThreads.findIndex(
                        t => t.id === data.threadId
                    );

                    if (currentThreadIndex !== -1) {
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

                        if (currentThreadIndex !== -1) {
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

            // Handle streaming message content (legacy format)
            if (typeof data === 'string') {
                const currentMessages = messages.get();
                const lastMessage = currentMessages[currentMessages.length - 1];

                if (lastMessage?.role === 'assistant') {
                    // Append to existing assistant message
                    messages.set([
                        ...currentMessages.slice(0, -1),
                        {
                            ...lastMessage,
                            content: lastMessage.content + data,
                        },
                    ]);
                } else {
                    // Create new assistant message
                    messages.set([...currentMessages, { role: 'assistant', content: data }]);
                }

                isLoading.set(false);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    socket.addEventListener('open', () => {
        reconnectAttempts = 0; // Reset attempts on successful connection

        const listeners = readyListeners;

        readyListeners = [];
        listeners.forEach(({ ready }) => ready());
    });

    socket.addEventListener('close', () => {
        if (generation !== socketGeneration) return;

        isTyping.set(false);
        isLoading.set(false);
        socketDid = null;
        ws = null;

        // Reconnect logic
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts += 1;
            setTimeout(connectWebSocket, 1000);
        } else {
            cancelReadyListeners(new Error('WebSocket connection retry limit reached'));
        }
    });

    socket.addEventListener('error', event => {
        console.error('WebSocket error:', event);
    });

    return;
}

// Function to send message in response to a selected question
export function sendMessageWithQuestion(content: string, selectedQuestion?: string) {
    if (!content.trim()) return;

    if (!auth.get().did) {
        showErrorModal('Authentication Required', 'Please sign in before sending a message.');
        return;
    }

    // Check if session has ended before sending message
    const thread = threads.get().find(t => t.id === currentThreadId.get());
    if (thread?.summaries?.length) {
        console.warn('Cannot send message: session has already ended');
        sessionEnded.set(true);
        return;
    }

    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        onReady(
            () => sendMessageWithQuestion(content, selectedQuestion),
            error => {
                console.error('WebSocket connection failed, message not sent:', error);
                showErrorModal(
                    'Connection Error',
                    'Could not connect to the chat service. Please try again later.'
                );
            }
        );
        return;
    }

    const currentMessages = messages.get();
    let newMessage: ChatMessage = { role: 'user', content };

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

            if (currentThreadIndex !== -1) {
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

    // Ensure WebSocket connection is established
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            await new Promise<void>((resolve, reject) => {
                connectWebSocket(); // Attempt to connect or reconnect
                onReady(resolve, reject);
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

    // Ensure WebSocket connection is established
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            await new Promise<void>((resolve, reject) => {
                connectWebSocket(); // Attempt to connect or reconnect
                onReady(resolve, reject);
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
        const activeSessionRes = await authenticatedFetch('/api/chat/active-session-status');
        if (!activeSessionRes.ok) {
            console.error('Failed to check active session status:', activeSessionRes.statusText);
            // Potentially allow proceeding, or show a more specific error to the user.
            // For now, we'll log and proceed cautiously.
        } else {
            const activeSessionData = await activeSessionRes.json();
            const currentKnownThreadId = currentThreadId.get();

            if (
                activeSessionData.isActive &&
                activeSessionData.activeThreadId &&
                activeSessionData.activeThreadId !== currentKnownThreadId
            ) {
                const userConfirmation = await showConfirmationModal(
                    `You have an active chat session titled "${activeSessionData.activeThreadTitle || 'Untitled'}".\n\nStarting a new topic will end this session. Do you want to proceed?`
                );

                if (!userConfirmation) {
                    isTyping.set(false);
                    isLoading.set(false);
                    if (activeSessionData.activeThreadId) {
                        console.log(
                            `User cancelled. Redirecting to active session: ${activeSessionData.activeThreadId}`
                        );
                        currentThreadId.set(activeSessionData.activeThreadId);
                        // Explicitly load the thread data for the active session
                        await loadThread(activeSessionData.activeThreadId);
                        // Potentially clear any UI input for the new topic here
                    }
                    return;
                } else {
                    // User confirmed to end the old session and start a new one
                    void authenticatedFetch('/threads/finish', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            threadId: activeSessionData.activeThreadId,
                            sendSummary: false,
                        }),
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error checking active session status:', error);
        // Decide if to proceed or block. For now, log and proceed.
    }

    // Ensure WebSocket is connected before sending message
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            connectWebSocket(); // Attempt to connect or reconnect
            await new Promise<void>((resolve, reject) => {
                onReady(resolve, reject); // Wait for WebSocket to be ready
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
    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        onReady(
            () => continuePlan(),
            error => {
                console.error('WebSocket connection failed, plan not continued:', error);
                showErrorModal(
                    'Connection Error',
                    'Could not connect to the chat service. Please try again later.'
                );
            }
        );
        return;
    }

    // Add placeholder for continuation streaming to a new assistant message
    const currentMsgs = messages.get();
    messages.set([...currentMsgs, { role: 'assistant', content: '' }]);
    isTyping.set(true);
    socket.send(JSON.stringify({ action: 'continue_plan', threadId }));
    planReady.set(false);
    planReadyThread.set(null);
}

// Function to finish a session immediately
export async function finishSession() {
    const { did } = auth.get();
    const threadId = currentThreadId.get();
    if (!did || !threadId) return;

    try {
        messages.set([
            ...messages.get(),
            { role: 'user', content: 'Finish Session' },
            { role: 'assistant', content: '' },
        ]);
        sessionEnded.set(true);

        const res = await authenticatedFetch('/threads/finish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId }),
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
    } catch (error) {
        console.error('Error finishing session:', error);
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

// Function to register a callback for when WebSocket is ready
export function onReady(listener: () => void, onCancel: (error: Error) => void = () => {}) {
    // Check if ws exists and is open
    if (ws?.readyState === WebSocket.OPEN) {
        listener(); // Run immediately if already ready
    } else {
        readyListeners.push({ cancel: onCancel, ready: listener });
    }
    // Return an unsubscribe function
    return () => {
        readyListeners = readyListeners.filter(({ ready }) => ready !== listener);
    };
}

currentThreadId.listen(threadId => {
    if (threadId) {
        const url = new URL(window.location.href);
        url.searchParams.set('threadId', threadId);
        window.history.replaceState({}, '', url);
    }
});
