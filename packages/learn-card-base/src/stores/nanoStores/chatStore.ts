import { atom } from 'nanostores';
import { v4 as uuid } from 'uuid';

import { auth } from './authStore';
import { resetArtifactsStore } from './artifactsStore';

import { showToast } from './toastStore';
import { showErrorModal } from './ErrorModalStore';

import { networkStore } from '../NetworkStore';
import type {
    ChatMessage,
    Thread,
    ThreadCredentialContext,
    LearningPathway,
} from '../../types/ai-chat';

export const messages = atom<ChatMessage[]>([]);
export const streamingMessage = atom<ChatMessage | null>(null);
export const threads = atom<Thread[]>([]);
export const currentThreadId = atom<string | null>(null);
export const isTyping = atom(false);
export const isLoading = atom(false);
export const isEndingSession = atom(false);
export const showEndingSessionLoader = atom(false);
export const activeQuestions = atom<string[]>([]);
export const suggestedTopics = atom<string[]>([]);
export const topicCredentials = atom<ThreadCredentialContext[]>([]);
export const sessionEnded = atom(false);
export const planReady = atom(false);
export const planReadyThread = atom<string | null>(null);
export type CredentialContextReadiness = {
    status: 'idle' | 'pending' | 'ready' | 'empty' | 'error';
    count: number;
    ingestionPhase?: 'queued' | 'active' | 'ready' | 'error';
};
export const credentialContextReadiness = atom<CredentialContextReadiness>({
    status: 'idle',
    count: 0,
});
export const chatInputText = atom('');
import { getLogger } from '../../logging/logger';
const log = getLogger('chat-store');

/**
 * The topic URI the current session was started against.
 * Populated by `startTopicWithUri` / `startLearningPathway` and
 * cleared by `resetChatStores`. Read by surfaces that need to
 * report session provenance (e.g. the pathway-progress event
 * bus publisher in `FinishSessionButton`).
 */
export const currentTopicUri = atom<string | null>(null);

/**
 * The AI-pathway URI the current session is walking through, if
 * any. Only populated by `startLearningPathway`; plain
 * `startTopicWithUri` sessions leave this null.
 */
export const currentAiPathwayUri = atom<string | null>(null);

/**
 * Timestamp of when the current session entered `isTyping: true` for
 * the first time — a proxy for "session started". Used by the
 * pathway-progress publisher to compute a duration estimate at
 * `finishSession` time. Cleared by `resetChatStores`.
 */
export const sessionStartedAt = atom<string | null>(null);

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

export const getBackendUrl = (): string => networkStore.get.aiServiceUrl();

/** @deprecated Use getBackendUrl() for dynamic tenant-aware URL */
export const BACKEND_URL = 'https://api.learncloud.ai';

const EMPTY_PLAN_METADATA = {
    sections: {
        title: '',
        objectives: 0,
        skills: 0,
        roadmap: 0,
    },
};

const EMPTY_PLAN_SECTIONS = {
    welcome: '',
    summary: '',
    objectives: [] as string[],
    skills: [] as string[],
    roadmap: [] as any[],
};
const CREDENTIAL_CONTEXT_STATUSES = {
    pending: true,
    ready: true,
    empty: true,
    error: true,
} satisfies Record<Exclude<CredentialContextReadiness['status'], 'idle'>, true>;
const CREDENTIAL_INGESTION_PHASES = {
    queued: true,
    active: true,
    ready: true,
    error: true,
} satisfies Record<NonNullable<CredentialContextReadiness['ingestionPhase']>, true>;

/** Returns whether a thread has explicit lifecycle or legacy summary evidence of ending. */
export const hasThreadEnded = (thread: Thread | undefined): boolean =>
    Boolean(thread?.ended_at || thread?.active === false || thread?.summaries?.length);

/**
 * Clear everything that represents a single AI session's in-flight state.
 * Preserves the `threads` sidebar list, `chatInputText`, and auth.
 * Call at the top of every start* entry point so the previous session's
 * plan/messages/streaming state don't bleed into the new one.
 */
export function resetChatSessionStores() {
    messages.set([]);
    streamingMessage.set(null);
    if (streamRaf != null) {
        cancelAnimationFrame(streamRaf);
        streamRaf = null;
    }
    streamBuffer = '';
    streamingId = null;
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
    credentialContextReadiness.set({ status: 'idle', count: 0 });
    currentTopicUri.set(null);
    currentAiPathwayUri.set(null);
    sessionStartedAt.set(null);
    planStreamActive.set(false);
    planMetadata.set(EMPTY_PLAN_METADATA);
    planSections.set(EMPTY_PLAN_SECTIONS);
    resetArtifactsStore();
}

/**
 * Reset all chat-related stores to their initial values.
 * Useful when starting a new session or logging out.
 */
export function resetChatStores() {
    resetChatSessionStores();
    threads.set([]);
    chatInputText.set('');
}

export enum AiSessionMode {
    tutor = 'ai-tutor',
    insights = 'ai-insights',
}

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let messageListeners: ((message: any) => void)[] = [];
let readyListeners: (() => void)[] = [];
let shouldReconnect = true;

const SESSION_START_WATCHDOG_MS = 32_000;
let startupWatchdog: number | undefined;
let currentSessionStartRequestId: string | null = null;

const isCurrentSessionStartFrame = (requestId: unknown) =>
    (requestId === undefined && currentSessionStartRequestId === null) ||
    (typeof requestId === 'string' && requestId === currentSessionStartRequestId);
const isCurrentThreadFrame = (threadId: unknown) =>
    typeof threadId !== 'string' || threadId === currentThreadId.get();

const clearSessionStartWatchdog = () => {
    if (startupWatchdog === undefined) return;

    window.clearTimeout(startupWatchdog);
    startupWatchdog = undefined;
};

const beginSessionStartWatchdog = () => {
    clearSessionStartWatchdog();
    currentSessionStartRequestId = null;

    startupWatchdog = window.setTimeout(() => {
        startupWatchdog = undefined;
        currentSessionStartRequestId = null;
        isLoading.set(false);
        isTyping.set(false);
        planStreamActive.set(false);
        showErrorModal('Something went wrong', 'Please try starting the session again.');
    }, SESSION_START_WATCHDOG_MS);
};

// RAF-coalesced streaming state
let streamBuffer = '';
let streamRaf: number | null = null;
let streamingId: string | null = null;

const flushStream = () => {
    streamRaf = null;
    if (!streamBuffer) return;
    const prev = streamingMessage.get();
    const id = streamingId ?? uuid();
    streamingId = id;
    streamingMessage.set({
        id,
        role: 'assistant',
        content: (prev?.content ?? '') + streamBuffer,
    });
    streamBuffer = '';
};

const scheduleFlush = () => {
    if (streamRaf != null) return;
    streamRaf = requestAnimationFrame(flushStream);
};

// Load user's threads
export async function loadThreads() {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${getBackendUrl()}/threads?did=${did}`);
        if (!response.ok) throw new Error('Failed to load threads');

        const threadList = await response.json();
        threads.set(threadList);
    } catch (error) {
        log.error('Error loading threads:', error);
    }
}

// Load messages for a specific thread
export async function loadThread(threadId: string) {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${getBackendUrl()}/messages?did=${did}&threadId=${threadId}`);
        if (!response.ok) throw new Error('Failed to load messages');

        const threadMessages = await response.json();
        messages.set(threadMessages);
        currentThreadId.set(threadId);

        // Reset active questions when loading a thread
        activeQuestions.set([]);

        // First check the current threads store, then reload if needed.
        let loadedThread = threads.get().find(t => t.id === threadId);
        if (!loadedThread) {
            await loadThreads();
            loadedThread = threads.get().find(t => t.id === threadId);
        }

        const hasSessionEnded = hasThreadEnded(loadedThread);

        sessionEnded.set(hasSessionEnded);

        log.debug(`Thread ${threadId} session ended: ${hasSessionEnded}`);

        // Load thread credentials
        const credsResponse = await fetch(
            `${getBackendUrl()}/thread_credentials?did=${did}&threadId=${threadId}`
        );
        if (!credsResponse.ok) {
            log.error('Failed to load thread credentials');
            topicCredentials.set([]);
        } else {
            const credsData: ThreadCredentialContext[] = await credsResponse.json();
            topicCredentials.set(credsData);
        }
    } catch (error) {
        log.error('Error loading messages:', error);
    }
}

// Create a new thread
export async function createThread() {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${getBackendUrl()}/threads?did=${did}`, {
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
        log.error('Error creating thread:', error);
    }
}

// Delete a thread
export async function deleteThread(threadId: string) {
    const { did } = auth.get();
    if (!did) return;

    try {
        const response = await fetch(`${getBackendUrl()}/threads?did=${did}&threadId=${threadId}`, {
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
        log.error('Error deleting thread:', error);
    }
}

// Fetch learning pathways for a thread
export async function fetchLearningPathways(threadId: string): Promise<LearningPathway[]> {
    const { did } = auth.get();
    if (!did) {
        log.error('Authentication required to fetch learning pathways');
        return [];
    }

    try {
        const response = await fetch(
            `${getBackendUrl()}/learning-pathways?did=${encodeURIComponent(
                did
            )}&threadId=${encodeURIComponent(threadId)}`
        );

        if (response.ok) {
            const data = await response.json();
            return data.pathways || [];
        } else {
            log.error('Failed to fetch learning pathways:', response.statusText);
            return [];
        }
    } catch (error) {
        log.error('Error fetching learning pathways:', error);
        return [];
    }
}

export function connectWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))
        return ws;

    const { did } = auth.get();
    if (!did) throw new Error('Authentication required');

    shouldReconnect = true;

    const wsUrl = getBackendUrl().replace(/^http/, 'ws');
    const threadIdQuery = currentThreadId.get() ? `&threadId=${currentThreadId.get()}` : '';

    ws = new WebSocket(`${wsUrl}?did=${did}${threadIdQuery}`);
    const socket = ws;

    ws.onmessage = event => {
        if (ws !== socket) return;

        try {
            const data = JSON.parse(event.data);
            if (data.event === 'session_start_accepted') {
                if (typeof data.requestId === 'string') {
                    currentSessionStartRequestId = data.requestId;
                }

                return;
            }

            if (data.event === 'no_conversation_summary') {
                if (!isCurrentThreadFrame(data.threadId)) return;
                isTyping.set(false);
                sessionEnded.set(true);
                return;
            }

            if (data.event === 'credentials_for_topic' && Array.isArray(data.credentials)) {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                topicCredentials.set(data.credentials);
                return;
            }
            if (data.event === 'credential_context_status') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;

                if (
                    typeof data.status !== 'string' ||
                    !Object.hasOwn(CREDENTIAL_CONTEXT_STATUSES, data.status)
                )
                    return;

                const status = data.status as keyof typeof CREDENTIAL_CONTEXT_STATUSES;
                const ingestionPhase =
                    typeof data.ingestionPhase === 'string' &&
                    Object.hasOwn(CREDENTIAL_INGESTION_PHASES, data.ingestionPhase)
                        ? (data.ingestionPhase as keyof typeof CREDENTIAL_INGESTION_PHASES)
                        : undefined;

                credentialContextReadiness.set({
                    status,
                    count: typeof data.count === 'number' ? data.count : 0,
                    ingestionPhase,
                });

                if (typeof data.threadId === 'string') {
                    const list = threads.get();
                    const index = list.findIndex(thread => thread.id === data.threadId);

                    if (index > -1) {
                        const copy = [...list];
                        copy[index] = {
                            ...copy[index],
                            credentialContextStatus: status,
                        };
                        threads.set(copy);
                    }
                }

                return;
            }

            if (data.event === 'credentials_ready') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
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

            if (data.event === 'plan_structured_delta') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                planStreamActive.set(true);

                const p = data.planData;

                planSections.set({
                    welcome: p.welcome ?? '',
                    summary: p.summary ?? '',
                    objectives: p.objectives ?? [],
                    skills: p.skills ?? [],
                    roadmap: p.roadmap ?? [],
                });

                return;
            }

            if (data.event === 'plan_structured') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                planMetadata.set({
                    sections: {
                        title: data.title,
                        objectives: data.planData.objectives.length,
                        skills: data.planData.skills.length,
                        roadmap: data.planData.roadmap.length,
                    },
                });

                planSections.set({
                    welcome: data.planData.welcome,
                    summary: data.planData.summary,
                    objectives: data.planData.objectives,
                    skills: data.planData.skills,
                    roadmap: data.planData.roadmap,
                });

                planStreamActive.set(false); // Stream complete
                return;
            }

            /* -------------------------------------------------- */
            /* PLAN LIFECYCLE                                    */
            /* -------------------------------------------------- */

            if (data.event === 'plan_intro') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                // The backend sends plan_ready immediately after plan_intro; readiness owns teardown.
                planStreamActive.set(false);
                isTyping.set(false);
                isLoading.set(false);
                return;
            }

            if (data.event === 'plan_ready') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                clearSessionStartWatchdog();
                isTyping.set(false);
                isLoading.set(false);
                planReady.set(true);
                planReadyThread.set(data.threadId);
                currentThreadId.set(data.threadId);
                const credentialContextStatus = credentialContextReadiness.get().status;

                if (data.title) {
                    const list = threads.get();
                    const idx = list.findIndex(t => t.id === data.threadId);

                    if (idx > -1) {
                        const copy = [...list];
                        copy[idx] = {
                            ...copy[idx],
                            title: data.title,
                            ...(credentialContextStatus === 'idle'
                                ? {}
                                : { credentialContextStatus }),
                        };
                        threads.set(copy);
                    } else {
                        threads.set([
                            {
                                id: data.threadId,
                                did: auth.get().did!,
                                title: data.title,
                                created_at: new Date().toISOString(),
                                last_message_at: new Date().toISOString(),
                                ...(credentialContextStatus === 'idle'
                                    ? {}
                                    : { credentialContextStatus }),
                            },
                            ...list,
                        ]);
                    }
                }
                return;
            }

            if (data.event === 'insights_ready') {
                // Insights sessions neither arm the startup watchdog nor use request-ID correlation.
                planReady.set(true);
                planReadyThread.set(data.threadId);
                currentThreadId.set(data.threadId);

                isLoading.set(true);
                isTyping.set(false);
                return;
            }

            // Handle conversation summary event
            /* -------------------------------------------------- */
            /* CONVERSATION SUMMARY                              */
            /* -------------------------------------------------- */

            if (data.event === 'conversation_summary') {
                if (!isCurrentThreadFrame(data.threadId)) return;
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
                log.debug(`[Mongo] ${data.data.collection}`, data.data);
                return;
            }

            if (data.event === 'topic_publication_status') {
                if (!isCurrentThreadFrame(data.threadId)) return;

                if (data.status === 'error') {
                    showErrorModal(
                        'Progress may not be saved',
                        'You can keep learning, but progress from this session may not be saved. Check your AI access settings and try again.'
                    );
                }

                return;
            }

            if (data.event === 'thread_updated') {
                if (!isCurrentThreadFrame(data.threadId)) return;

                if (data.phase === 'responding') isTyping.set(true);

                void loadThread(data.threadId).finally(() => {
                    if (data.phase !== 'responding') isTyping.set(false);
                });
                return;
            }

            if (data.event === 'thread_busy') {
                if (!isCurrentThreadFrame(data.threadId)) return;

                void loadThread(data.threadId);
                showErrorModal(
                    'Session is busy',
                    'Another tab is already waiting for a response. This session will update when it is ready.'
                );
                return;
            }

            if (data.event === 'session_replaced') {
                if (!isCurrentThreadFrame(data.threadId)) return;

                clearSessionStartWatchdog();
                disconnectWebSocket();
                isLoading.set(false);
                isTyping.set(false);
                planStreamActive.set(false);
                sessionEnded.set(true);
                threads.set(
                    threads.get().map(thread =>
                        thread.id === data.threadId
                            ? {
                                  ...thread,
                                  active: false,
                                  ended_at: new Date().toISOString(),
                              }
                            : thread
                    )
                );
                showErrorModal(
                    'Session opened elsewhere',
                    'This session ended because a new AI session was started in another tab or device.'
                );
                return;
            }

            // Handle session completed event
            if (data.event === 'session_completed') {
                if (!isCurrentThreadFrame(data.threadId)) return;
                log.debug('Session already completed for this thread');
                isLoading.set(false);
                isTyping.set(false);
                sessionEnded.set(true);
                return;
            }

            if (data.event === 'session_start_error') {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                clearSessionStartWatchdog();
                isLoading.set(false);
                isTyping.set(false);
                planStreamActive.set(false);
                showErrorModal('Something went wrong', 'Please try starting the session again.');
                return;
            }

            if (data.error) {
                if (!isCurrentSessionStartFrame(data.requestId)) return;
                const isStartupPending = startupWatchdog !== undefined;
                clearSessionStartWatchdog();
                log.error('Error:', data.error);
                isLoading.set(false);
                isTyping.set(false);
                planStreamActive.set(false);
                if (isStartupPending || typeof data.requestId === 'string') {
                    showErrorModal(
                        'Something went wrong',
                        'Please try starting the session again.'
                    );
                }
                return;
            }

            if (data.event === 'assistant_typing') {
                if (data.threadId && !isCurrentThreadFrame(data.threadId)) return;
                isLoading.set(false);
                isTyping.set(true);
                return;
            }

            // Handle structured response
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
                // Flush any pending streaming tokens before committing
                if (streamRaf != null) {
                    cancelAnimationFrame(streamRaf);
                    flushStream();
                }
                const pending = streamingMessage.get();
                if (pending) {
                    messages.set([...messages.get(), pending]);
                    streamingMessage.set(null);
                }
                streamingId = null;

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
            /* LEGACY STREAM (STRING) — RAF-coalesced             */
            /* -------------------------------------------------- */

            if (typeof data === 'string') {
                streamBuffer += data;
                scheduleFlush();
                isLoading.set(false);
                isTyping.set(true);
            }

            if (data.event === 'artifact_suggestion') {
                log.debug('artifact_suggestion', data.artifact);

                const existing = messages
                    .get()
                    .some(m => m.role === 'assistant' && m.artifact?.title === data.artifact.title);

                if (existing) return;

                messages.set([
                    ...messages.get(),
                    {
                        role: 'assistant',
                        content: null,
                        artifact: { ...data.artifact, id: uuid(), claimed: false },
                    },
                ]);
            }
        } catch (err) {
            log.error('WebSocket message error:', err);
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

        // Flush any partial streaming message so interrupted streams aren't lost
        if (streamRaf != null) {
            cancelAnimationFrame(streamRaf);
            flushStream();
        }
        const pending = streamingMessage.get();
        if (pending) {
            messages.set([...messages.get(), pending]);
            streamingMessage.set(null);
        }
        streamingId = null;

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
        log.error('WebSocket error:', err);
    };

    return ws;
}

// Function to update artifact claimed status by artifact ID
export function updateArtifactClaimedStatus(artifactId: string, claimed: boolean) {
    const currentMessages = messages.get();
    const updatedMessages = currentMessages.map(msg => {
        if (msg.artifact && msg.artifact.id === artifactId) {
            return {
                ...msg,
                artifact: {
                    ...msg.artifact,
                    claimed: claimed,
                },
            };
        }
        return msg;
    });

    messages.set(updatedMessages);
}

// Function to send message in response to a selected question
export function sendMessageWithQuestion(content: string, selectedQuestion?: string) {
    if (!content.trim()) return;

    const thread = threads.get().find(t => t.id === currentThreadId.get());
    if (hasThreadEnded(thread)) {
        log.warn('Cannot send message: session has already ended');
        sessionEnded.set(true);
        return;
    }

    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        onReady(() => sendMessageWithQuestion(content, selectedQuestion));
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
            id: uuid(),
            role: 'user',
            content,
        };
    } else {
        // Regular user message
        newMessage = {
            id: uuid(),
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
    resetChatSessionStores();
    isTyping.set(true);
    isLoading.set(true);

    // Pathway-progress provenance: record the topic (no pathway) so
    // `FinishSessionButton` can publish a well-formed
    // `AiSessionCompleted` event at finish time.
    currentTopicUri.set(topicUri);
    currentAiPathwayUri.set(null);
    sessionStartedAt.set(new Date().toISOString());

    const { did } = auth.get();
    if (!did) {
        log.error('Authentication required to start a topic with URI.');
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
            connectWebSocket();
            await waitForSocketConnection();
        } catch (error) {
            log.error('WebSocket connection failed, cannot start topic with URI:', error);
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
        introStreamMode: 'structured',
        did,
    };

    beginSessionStartWatchdog();
    sendWhenReady(messageToSend);
}

const waitForSocketConnection = (): Promise<void> => {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    let unsubscribe = () => {};
    const timeout = window.setTimeout(() => {
        unsubscribe();
        reject(new Error('WebSocket connection timeout'));
    }, 5000);

    unsubscribe = onReady(() => {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve();
    });

    return promise;
};

// Function to start a new learning pathway with topic and pathway URIs
export async function startLearningPathway(topicUri: string, pathwayUri: string) {
    resetChatSessionStores();
    isTyping.set(true);
    isLoading.set(true);

    // Pathway-progress provenance: record both topic and AI pathway
    // URIs so the `AiSessionCompleted` event published at finish time
    // carries the full context.
    currentTopicUri.set(topicUri);
    currentAiPathwayUri.set(pathwayUri);
    sessionStartedAt.set(new Date().toISOString());

    const { did } = auth.get();
    if (!did) {
        log.error('Authentication required to start a learning pathway.');
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
            connectWebSocket();
            await waitForSocketConnection();
        } catch (error) {
            log.error('WebSocket connection failed, cannot start learning pathway:', error);
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
        introStreamMode: 'structured',
        did,
    };

    beginSessionStartWatchdog();
    sendWhenReady(messageToSend);
}

// Function to initiate a new session plan for a topic
export async function startTopic(topic: string, mode: AiSessionMode = AiSessionMode.tutor) {
    resetChatSessionStores();
    isTyping.set(true);
    isLoading.set(true);

    const { did } = auth.get();

    if (!did) {
        log.error('Authentication required to start a topic.');
        isTyping.set(false);
        isLoading.set(false);
        return;
    }

    // Reset WebSocket to avoid overlapping streams when starting a new topic
    disconnectWebSocket();

    // Ensure WebSocket is connected before sending message
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            connectWebSocket();
            await waitForSocketConnection();
        } catch (error) {
            log.error('WebSocket connection failed, cannot start topic:', error);
            isTyping.set(false);
            isLoading.set(false);
            showErrorModal(
                'Connection Error',
                'Could not connect to the chat service. Please try again later.'
            );
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
        mode,
    };

    beginSessionStartWatchdog();
    sendWhenReady(messageToSend);
}

export async function startInsightsSession(topic: string, initialText?: string) {
    resetChatSessionStores();
    isTyping.set(true);
    isLoading.set(true);

    messages.set([
        {
            role: 'assistant',
            content: '', // placeholder for streaming
        },
    ]);

    const { did } = auth.get();
    if (!did) {
        isTyping.set(false);
        isLoading.set(false);
        showErrorModal('Authentication Required', 'Please sign in to start Insights.');
        return;
    }

    disconnectWebSocket();
    currentThreadId.set(null);

    // Ensure WS connected
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        try {
            connectWebSocket();
            await waitForSocketConnection();
        } catch (err) {
            log.error('WS connect failed:', err);
            isTyping.set(false);
            isLoading.set(false);
            showErrorModal('Connection Error', 'Could not connect to chat service.');
            return;
        }
    }

    const firstMessage = (initialText?.trim() || `Let's do insights on: ${topic}`).trim();

    ws!.send(
        JSON.stringify({
            mode: AiSessionMode.insights,
            topic,
            message: { id: uuid(), role: 'user', content: firstMessage },
        })
    );
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
            { id: uuid(), role: 'user', content: 'Finish Session' },
            { id: uuid(), role: 'assistant', content: '' },
        ]);
        sessionEnded.set(true);

        const res = await fetch(`${getBackendUrl()}/threads/finish?did=${did}`, {
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
        log.error('Error finishing session: ', err);
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
    clearSessionStartWatchdog();
    shouldReconnect = false;
    if (ws) {
        try {
            ws.close();
        } catch (e) {
            log.error('WebSocket close error:', e);
        }
        ws = null;
    }
}

// Send a payload as soon as the socket is open. Avoids polling setTimeout loops
// for the "send right after connect" race that can otherwise add up to 100ms of
// idle wait per first message.
function sendWhenReady(payload: unknown) {
    const json = JSON.stringify(payload);
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(json);
        return;
    }
    onReady(() => {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(json);
    });
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

export async function closeInsightsSession(threadId?: string) {
    const activeThreadId = threadId || currentThreadId.get();

    if (!activeThreadId) return;

    const socket = connectWebSocket();
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        onReady(() => closeInsightsSession(activeThreadId));
        return;
    }

    socket.send(
        JSON.stringify({
            action: 'close_insights_session',
            threadId: activeThreadId,
        })
    );

    // Optimistically reset state
    messages.set([]);
    currentThreadId.set(null);
    planReady.set(false);
    planReadyThread.set(null);
    sessionEnded.set(false);
    activeQuestions.set([]);
    topicCredentials.set([]);

    // Refresh thread list
    loadThreads();
}
