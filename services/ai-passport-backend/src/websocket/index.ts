import {
    AiSessionMode,
    AuthenticatedMessageValidator,
    type AuthenticatedMessage,
    type ChatMessage,
} from '@learncard/types';
import type { ServerWebSocket } from 'bun';
import { aiCall, streamingAiCall, streamingStructuredAiCall } from '../ai';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources';
import { detectProvider, parseOpenAIModelAlias } from '../ai/providers';
import { isAiProviderError, toAiErrorPayload } from '../ai/errors';

import { sendConversationSummary, createTopicVCStructure } from '../services/awarding';
import { getSuggestedTopics } from '../credentials/service';
import { CredentialVerificationUnavailableError } from '../credentials/verification';
import { beginCredentialContextRead, credentialFailureCodeOf } from '../credentials/batch';
import { classifyLearnCardFailure, learnCardFailureLogFields } from '../learncard/errors';
import { type DBMessage, db } from '../db';
import { getLearnCard } from '../learncard';
import { createAndPublishBoostCredential } from '../learncard/boost-helpers';
import { readOwnedBoostCredential } from '../learncard/external-artifacts';
import { formatSessionPlanMarkdown } from '../services/sessionPlans';
import {
    SessionPlanDataValidator,
    PlanCompletionValidator,
    type SessionPlanData,
} from '../ai/generation-schemas';
import {
    searchCredentialContextsByTopic,
    searchCredentialsByTopic,
    type TopicSearchContext,
    warmCredentialTopicExpansion,
} from '../services/credentialSearch';
import { createActiveSessionThread } from '../services/sessionLifecycle';
import { unsubscribeWebSocketFromAllJobs } from '../workers/subscriptions';
import { getInsightsPrompt, maybeGenerateArtifact } from '../services/insightSessions';
import { createRequestTiming, type RequestTiming, type TimingData } from '../utils/timing';
import {
    activeStartups,
    isCurrentStartup,
    isStartupOwner,
    type ActiveStartup,
    type StartupSocket,
} from './startupOwnership';
import {
    getCredentialIngestionState,
    isCredentialIngestionPending,
    waitForCredentialIngestion,
    refreshCredentialIngestionState,
} from '../workers/credentialIngestionState';
import {
    withOwnerOperation,
    isDataErasureRequestedError,
    registerOwnerSocket,
    unregisterOwnerSocket,
} from '../services/dataErasure';
import { logSafeEvent, type SafeLogMetrics } from '../logging';

import {
    CHAT_MODEL,
    FORMATTING_MODEL,
    PLANNING_MODEL,
    SESSION_CONTEXT_BUDGET_MS,
    SESSION_FIRST_MODULE_CONTEXT_WAIT_MS,
    SESSION_PLAN_TIMEOUT_MS,
    CREDENTIAL_INGESTION_STARTUP_WAIT_MS,
    TITLE_MODEL,
} from '../constants/env';

type ChatSocket = StartupSocket;

type StartupRequest = ActiveStartup & {
    receivedAt: number;
    deadlineAt: number;
    signal: AbortSignal;
    /** start_topic only: what a repeated request must match to join this one. */
    dedupeKey?: string;
};

// A start_topic repeated on the same socket (same topic and mode) this soon
// after a live one joins it instead of aborting it and starting over.
const START_TOPIC_DEDUPE_MS = 2000;
// The deferred credential context runs to the later of the plan deadline and
// this long after it starts, not only what the plan left of its deadline.
const DEFERRED_CONTEXT_MIN_BUDGET_MS = 15_000;

const PLAN_START_ACTIONS = new Set(['start_topic', 'start_topic_uri', 'start_learning_pathway']);

export { activeStartups, isCurrentStartup } from './startupOwnership';
const publicationOwners = new Map<string, ActiveStartup>();

const startupCleanup = new WeakMap<ActiveStartup, () => void>();
const threadCredentialCompletions = new Map<string, Promise<void>>();
export const threadClients = new Map<string, Set<ChatSocket>>();
const activeThreadInteractions = new Set<string>();

const associateThreadClient = (ws: ChatSocket, threadId: string): void => {
    const previousThreadId = ws.data.threadId;

    if (previousThreadId && previousThreadId !== threadId) {
        const previousClients = threadClients.get(previousThreadId);

        previousClients?.delete(ws);
        if (previousClients?.size === 0) threadClients.delete(previousThreadId);
    }

    ws.data.threadId = threadId;

    const clients = threadClients.get(threadId) ?? new Set<ChatSocket>();
    clients.add(ws);
    threadClients.set(threadId, clients);
};

export const getThreadClients = (did: string, threadId: string): ChatSocket[] =>
    [...(threadClients.get(threadId) ?? [])].filter(client => client.data.did === did);

export const getThreadClient = (did: string, threadId: string): ChatSocket | undefined =>
    getThreadClients(did, threadId).at(-1);

export const sendToThreadClients = (
    did: string,
    threadId: string,
    payload: unknown,
    exclude?: ChatSocket
): void => {
    for (const client of getThreadClients(did, threadId)) {
        if (client === exclude || client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
};

const notifyReplacedThreads = (
    did: string,
    threadIds: string[],
    initiatingSocket: ChatSocket
): void => {
    for (const threadId of threadIds) {
        sendToThreadClients(
            did,
            threadId,
            {
                event: 'session_replaced',
                threadId,
            },
            initiatingSocket
        );
    }
};

type CredentialContextStatus = 'pending' | 'ready' | 'empty' | 'error';

const sendCredentialContextStatus = (
    did: string,
    startup: StartupRequest,
    threadId: string,
    status: CredentialContextStatus,
    count: number
): void => {
    sendForCurrentStartup(did, startup.requestId, startup.ws, {
        event: 'credential_context_status',
        threadId,
        status,
        count,
        ingestionPhase: getCredentialIngestionState(did)?.phase,
    });
};

const createDeadlineSignal = (
    parentSignal: AbortSignal,
    deadlineAt: number
): { signal: AbortSignal; dispose: () => void } => {
    const controller = new AbortController();
    const abortFromParent = (): void => controller.abort(parentSignal.reason);
    const timeout = setTimeout(
        () => controller.abort(new DOMException('Session plan deadline exceeded', 'TimeoutError')),
        Math.max(0, deadlineAt - performance.now())
    );

    parentSignal.addEventListener('abort', abortFromParent, { once: true });

    return {
        signal: controller.signal,
        dispose: () => {
            clearTimeout(timeout);
            parentSignal.removeEventListener('abort', abortFromParent);
        },
    };
};

const findDuplicateStartup = (
    did: string,
    ws: ChatSocket,
    dedupeKey: string | undefined,
    receivedAt: number
): StartupRequest | undefined => {
    const previous = activeStartups.get(did) as StartupRequest | undefined;
    if (
        dedupeKey === undefined ||
        previous?.dedupeKey !== dedupeKey ||
        !isCurrentStartup(did, previous.requestId, ws) ||
        previous.signal.aborted ||
        receivedAt - previous.receivedAt > START_TOPIC_DEDUPE_MS
    )
        return undefined;
    return previous;
};

const beginStartup = (
    did: string,
    ws: ChatSocket,
    receivedAt: number,
    dedupeKey?: string
): StartupRequest => {
    const previous = activeStartups.get(did);
    const previousPublication = publicationOwners.get(did);

    previous?.controller.abort();
    previousPublication?.controller.abort();
    publicationOwners.delete(did);
    if (previous) startupCleanup.get(previous)?.();

    const controller = new AbortController();
    const deadlineAt = receivedAt + SESSION_PLAN_TIMEOUT_MS;
    const deadline = createDeadlineSignal(controller.signal, deadlineAt);
    const startup: StartupRequest = {
        requestId: crypto.randomUUID(),
        controller,
        ws,
        receivedAt,
        deadlineAt,
        signal: deadline.signal,
        dedupeKey,
    };

    activeStartups.set(did, startup);
    startupCleanup.set(startup, deadline.dispose);
    safeSend(ws, {
        event: 'session_start_accepted',
        requestId: startup.requestId,
    });

    return startup;
};

const clearCurrentStartup = (did: string, requestId: string, ws: ChatSocket): void => {
    const current = activeStartups.get(did);

    if (!isStartupOwner(did, requestId, ws) || !current) return;

    startupCleanup.get(current)?.();
    activeStartups.delete(did);
};

export const handleInsightsChat = async (
    ws: ServerWebSocket<any>,
    did: string,
    threadId: string,
    data: AuthenticatedMessage
) => {
    const userMessage = data.message!;
    const userText = userMessage.content || '';

    // store User Message
    await db.addMessage(did, threadId, userMessage);

    // get conversation
    const messages = await db.getModelMessages(did, threadId);

    // get credentials for context
    const vcResults = (await db.getThreadCredentials(did, threadId)) || [];
    const vcContext = vcResults.map(r => `- ${r.context}`).join('\n');

    const formattedMessages: ChatCompletionMessageParam[] = [];

    for (const message of messages) {
        if (message.role === 'tool') {
            if (message.tool_call_id)
                formattedMessages.push({
                    role: 'tool',
                    content: message.content ?? '',
                    tool_call_id: message.tool_call_id,
                });

            continue;
        }

        if (message.role === 'assistant') {
            formattedMessages.push({
                role: 'assistant',
                content: message.content,
                ...(message.tool_calls ? { tool_calls: message.tool_calls } : {}),
            });
            continue;
        }

        formattedMessages.push({
            role: message.role,
            content: message.content ?? '',
        });
    }

    // notify client typing
    ws.send(JSON.stringify({ event: 'assistant_typing', threadId }));

    // stream assistant reply
    const reply = await streamingAiCall({
        model: CHAT_MODEL,
        systemPrompt: getInsightsPrompt(vcContext),
        message: formattedMessages,
        options: {
            onChunk: chunk => {
                if (chunk) ws.send(JSON.stringify(chunk));
            },
            accumulateContent: true,
        },
    });

    // store assistant message
    await db.addMessage(did, threadId, {
        role: 'assistant',
        content: reply ?? '',
    });

    // Notify the client before the optional artifact follow-up finishes.
    ws.send(JSON.stringify({ done: true, threadId }));
    void withOwnerOperation(
        did,
        () =>
            handleArtifactSuggestion(ws, did, threadId, userText).catch(error =>
                console.error('Artifact suggestion failed:', error)
            ),
        { detached: true }
    ).catch(() => logSafeEvent('error', 'background_job_failed'));
};

export const handleArtifactSuggestion = async (
    ws: ServerWebSocket<unknown>,
    did: string,
    threadId: string,
    userText: string
) => {
    const artifact = await maybeGenerateArtifact(userText);

    if (!artifact) return;

    // cooldown
    // if (!(await db.canSuggestArtifact(threadId))) return;

    // dedupe
    const exists = await db.hasArtifactSuggestion(did, threadId, artifact.title, artifact.category);

    if (exists) return;

    // persist
    const storedArtifact = await db.storeArtifactSuggestion(did, threadId, artifact, userText);

    // send suggestion event
    ws.send(
        JSON.stringify({
            event: 'artifact_suggestion',
            artifact: {
                ...artifact,
                id: storedArtifact._id,
            },
            threadId,
        })
    );
};
const safeSend = (ws: ChatSocket, payload: unknown): void => {
    if (ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify(payload));
};

export const sendForCurrentStartup = (
    did: string,
    requestId: string,
    ws: ChatSocket,
    payload: unknown
): boolean => {
    if (!isCurrentStartup(did, requestId, ws)) return false;

    safeSend(
        ws,
        payload && typeof payload === 'object' && !Array.isArray(payload)
            ? { ...payload, requestId }
            : payload
    );

    return true;
};

const containsVisiblePlanData = (value: unknown): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (!value || typeof value !== 'object') return false;

    return Object.values(value).some(containsVisiblePlanData);
};

const streamStructuredPlan = async (
    ws: ChatSocket,
    did: string,
    startup: StartupRequest,
    title: string,
    planData: SessionPlanData,
    timing: RequestTiming
): Promise<void> => {
    timing.markFirstDelta();

    if (
        !sendForCurrentStartup(did, startup.requestId, ws, {
            event: 'plan_structured',
            title,
            planData,
        })
    ) {
        throw new DOMException('Session start superseded', 'AbortError');
    }
};

const streamStructuredPlanGeneration = async (
    ws: ChatSocket,
    did: string,
    startup: StartupRequest,
    systemPrompt: string,
    userMessage: string,
    timing: RequestTiming,
    timeoutMs: number
): Promise<SessionPlanData> => {
    const { apiModel } = parseOpenAIModelAlias(PLANNING_MODEL);

    timing.mark('plan.stream_open', {
        model: apiModel,
        provider: detectProvider(PLANNING_MODEL),
    });

    return streamingStructuredAiCall({
        systemPrompt,
        message: userMessage,
        output: SessionPlanDataValidator,
        toolName: 'session_plan',
        model: PLANNING_MODEL,
        signal: startup.signal,
        timeoutMs,
        onPartial: partial => {
            if (containsVisiblePlanData(partial)) timing.markFirstDelta();

            if (
                !sendForCurrentStartup(did, startup.requestId, ws, {
                    event: 'plan_structured_delta',
                    planData: partial,
                })
            ) {
                throw new DOMException('Session start superseded', 'AbortError');
            }
        },
    });
};

type OpeningCredentialContext = {
    contexts: TopicSearchContext[];
    status: 'pending' | 'ready' | 'empty';
};

// Time left on a bound, with no startup ownership check: the deferred context
// belongs to its thread, not to the socket or startup that began it.
const getBoundRemainingMs = (bound: { signal: AbortSignal; deadlineAt: number }): number => {
    bound.signal.throwIfAborted();

    const remainingMs = Math.floor(bound.deadlineAt - performance.now());

    if (remainingMs <= 0) {
        throw new DOMException('Session plan deadline exceeded', 'TimeoutError');
    }

    return remainingMs;
};

const getStartupRemainingMs = (
    did: string,
    startup: StartupRequest,
    bound: { signal: AbortSignal; deadlineAt: number } = startup
): number => {
    if (!isCurrentStartup(did, startup.requestId, startup.ws)) {
        throw new DOMException('Session start superseded', 'AbortError');
    }

    return getBoundRemainingMs(bound);
};

const getPublicationRemainingMs = (did: string, startup: StartupRequest): number => {
    if (publicationOwners.get(did) !== startup || startup.controller.signal.aborted) {
        throw new DOMException('Topic publication superseded', 'AbortError');
    }

    startup.signal.throwIfAborted();

    const remainingMs = Math.floor(startup.deadlineAt - performance.now());

    if (remainingMs <= 0) {
        throw new DOMException('Topic publication deadline exceeded', 'TimeoutError');
    }

    return remainingMs;
};

const isAbortError = (error: unknown): boolean =>
    error instanceof Error && error.name === 'AbortError';

const isTimeoutError = (error: unknown): boolean =>
    error instanceof Error && error.name.toLowerCase().includes('timeout');

/**
 * credential_context.complete / deferred_complete outcomes. "timeout" and
 * "aborted" are reserved for a real deadline or abort; anything else that
 * fails is "error" and gets a credential_context_failed event. A fired opening
 * context deadline also logs one, with failureCode request_timeout.
 */
type CredentialContextFailureOutcome = 'timeout' | 'aborted' | 'error';

const getCredentialContextFailureOutcome = (error: unknown): CredentialContextFailureOutcome =>
    isTimeoutError(error) ? 'timeout' : isAbortError(error) ? 'aborted' : 'error';

/**
 * A context deadline that fired is a timeout even when a wrapper renamed its
 * error. A known failure (e.g. a LearnCard 401) that lands after the deadline
 * keeps its own code, as does a marked credential failure (credential_invalid).
 */
const classifyCredentialContextFailure = (
    error: unknown,
    deadlineFired = false
): NonNullable<SafeLogMetrics['failureCode']> =>
    classifyLearnCardFailure(error) ??
    (error instanceof CredentialVerificationUnavailableError
        ? 'credential_verification_unavailable'
        : error instanceof Error && error.name === 'AiConsentError'
          ? 'consent_denied'
          : deadlineFired || isTimeoutError(error)
            ? 'request_timeout'
            : credentialFailureCodeOf(error));

/** The verifier's own enum subreason; never its message or cause. */
const verificationSubreasonOf = (
    error: unknown
): Pick<SafeLogMetrics, 'verificationSubreason' | 'verifierErrorKind'> =>
    error instanceof CredentialVerificationUnavailableError && error.verificationSubreason
        ? {
              verificationSubreason: error.verificationSubreason,
              ...(error.verifierErrorKind ? { verifierErrorKind: error.verifierErrorKind } : {}),
          }
        : {};

const logCredentialContextFailure = (
    error: unknown,
    contextPhase: 'opening' | 'deferred',
    durationMs: number,
    candidateCount: number,
    deadlineFired = false
): void => {
    logSafeEvent('warn', 'credential_context_failed', {
        failureCode: classifyCredentialContextFailure(error, deadlineFired),
        contextPhase,
        durationMs,
        candidateCount,
        ...learnCardFailureLogFields(error),
        ...verificationSubreasonOf(error),
    });
};

const createStartupTiming = (did: string, startup: StartupRequest, action: string): RequestTiming =>
    createRequestTiming({
        ws: startup.ws,
        requestId: startup.requestId,
        action,
        send: (timing: TimingData) => {
            sendForCurrentStartup(did, startup.requestId, startup.ws, {
                event: 'timing',
                data: timing,
            });
        },
    });

// A credential-context read: the preload yields to it while it runs.
const asCredentialContextRead = async <T>(did: string, run: () => Promise<T>): Promise<T> => {
    const endContextRead = beginCredentialContextRead(did);
    try {
        return await run();
    } finally {
        endContextRead();
    }
};

const resolveOpeningCredentialContext = (
    topic: string,
    did: string,
    threadPromise: Promise<string>,
    startup: StartupRequest,
    timing: RequestTiming
): Promise<{ threadId: string; opening: OpeningCredentialContext }> =>
    asCredentialContextRead(did, () =>
        openCredentialContext(topic, did, threadPromise, startup, timing)
    );

const openCredentialContext = async (
    topic: string,
    did: string,
    threadPromise: Promise<string>,
    startup: StartupRequest,
    timing: RequestTiming
): Promise<{ threadId: string; opening: OpeningCredentialContext }> => {
    const contextDeadlineAt = Math.min(
        startup.deadlineAt,
        performance.now() + SESSION_CONTEXT_BUDGET_MS
    );
    const contextDeadline = createDeadlineSignal(startup.controller.signal, contextDeadlineAt);
    const contextStartedAt = performance.now();
    await refreshCredentialIngestionState(did);
    const ingestionPhaseAtSearch = getCredentialIngestionState(did)?.phase;
    const ingestionPendingAtSearch = isCredentialIngestionPending(did);
    let embeddingTextsFromCache = false;
    let candidateCount = 0;
    let filteredCount = 0;
    let resultCount = 0;
    let lowestScore: number | undefined;
    let highestScore: number | undefined;
    let highestStrongestScore: number | undefined;
    let highestAverageScore: number | undefined;
    let maxMatchCount: number | undefined;
    const searchPromise = searchCredentialContextsByTopic(topic, did, {
        limit: 5,
        expandQueries: false,
        // Stored ingest-time text, not a live verify, so the opening context
        // lands inside its short budget. The deferred search still verifies live.
        preferStoredText: true,
        signal: contextDeadline.signal,
        deadlineAt: contextDeadlineAt,
        onMetrics: metrics => {
            embeddingTextsFromCache = metrics.embeddingTextsFromCache;
            candidateCount = metrics.candidateCount;
            filteredCount = metrics.filteredCount;
            resultCount = metrics.resultCount;
            lowestScore = metrics.lowestScore;
            highestScore = metrics.highestScore;
            highestStrongestScore = metrics.highestStrongestScore;
            highestAverageScore = metrics.highestAverageScore;
            maxMatchCount = metrics.maxMatchCount;
        },
    })
        .then(contexts => ({ contexts }))
        .catch((error: unknown) => ({ error }));

    let threadId: string;

    try {
        threadId = await threadPromise;
    } catch (error) {
        timing.mark('credential_context.complete', {
            outcome: 'error',
            count: 0,
            ingestionPhaseAtSearch,
            indexWarm: !ingestionPendingAtSearch,
        });
        startup.controller.abort(error);
        contextDeadline.dispose();
        throw error;
    }

    try {
        getStartupRemainingMs(did, startup);
        await db.setThreadCredentialContextState(threadId, did, 'pending', topic);
        sendCredentialContextStatus(did, startup, threadId, 'pending', 0);
        getStartupRemainingMs(did, startup);

        const outcome = await searchPromise;

        if (!isCurrentStartup(did, startup.requestId, startup.ws)) {
            throw new DOMException('Session start superseded', 'AbortError');
        }

        if ('contexts' in outcome) {
            if (ingestionPendingAtSearch) {
                if (outcome.contexts.length > 0) {
                    await db.storeThreadCredentials(did, threadId, outcome.contexts);
                    await db.setThreadCredentialContextState(threadId, did, 'pending', topic);
                }

                timing.mark('credential_context.complete', {
                    outcome: 'provisional',
                    count: outcome.contexts.length,
                    candidateCount,
                    filteredCount,
                    lowestScore,
                    highestScore,
                    highestStrongestScore,
                    highestAverageScore,
                    maxMatchCount,
                    embeddingTextsFromCache,
                    ingestionPhaseAtSearch,
                    indexWarm: false,
                });
                sendCredentialContextStatus(
                    did,
                    startup,
                    threadId,
                    'pending',
                    outcome.contexts.length
                );

                return {
                    threadId,
                    opening: { contexts: outcome.contexts, status: 'pending' },
                };
            }

            const status = outcome.contexts.length > 0 ? 'ready' : 'empty';

            await db.storeThreadCredentials(did, threadId, outcome.contexts);
            timing.mark('credential_context.complete', {
                outcome: status === 'ready' ? 'completed' : 'empty',
                count: outcome.contexts.length,
                candidateCount,
                filteredCount,
                lowestScore,
                highestScore,
                highestStrongestScore,
                highestAverageScore,
                maxMatchCount,
                embeddingTextsFromCache,
                ingestionPhaseAtSearch,
                indexWarm: true,
            });
            sendCredentialContextStatus(did, startup, threadId, status, outcome.contexts.length);

            return {
                threadId,
                opening: { contexts: outcome.contexts, status },
            };
        }

        const failureOutcome = getCredentialContextFailureOutcome(outcome.error);
        // Our context deadline fired while the session itself is still live.
        const deadlineFired = contextDeadline.signal.aborted && !startup.controller.signal.aborted;
        /* A wrapper (e.g. the provider circuit) can rename the deadline's
       TimeoutError. Once the deadline fired, an otherwise unclassified
       failure is that timeout, and is logged with a timeout code. */
        const wrappedDeadline =
            failureOutcome === 'error' &&
            deadlineFired &&
            classifyCredentialContextFailure(outcome.error) === 'unknown';

        // Only a real deadline or abort is a timeout. A LearnCard 401 that merely
        // arrives after the deadline is still an error and is logged as one.
        if ((failureOutcome !== 'error' || wrappedDeadline) && !startup.controller.signal.aborted) {
            // Log a fired opening deadline so the server side sees it too.
            if (deadlineFired)
                logCredentialContextFailure(
                    outcome.error,
                    'opening',
                    Math.round(performance.now() - contextStartedAt),
                    candidateCount,
                    true
                );
            timing.mark('credential_context.complete', {
                outcome: 'timeout',
                count: 0,
                candidateCount,
                filteredCount,
                embeddingTextsFromCache,
                ingestionPhaseAtSearch,
                indexWarm: !ingestionPendingAtSearch,
            });

            return {
                threadId,
                opening: { contexts: [], status: 'pending' },
            };
        }

        if (startup.signal.aborted) startup.signal.throwIfAborted();

        logCredentialContextFailure(
            outcome.error,
            'opening',
            Math.round(performance.now() - contextStartedAt),
            candidateCount
        );
        timing.mark('credential_context.complete', {
            outcome: 'error',
            count: resultCount,
            candidateCount,
            filteredCount,
            embeddingTextsFromCache,
            ingestionPhaseAtSearch,
            indexWarm: !ingestionPendingAtSearch,
        });

        return {
            threadId,
            opening: { contexts: [], status: 'pending' },
        };
    } finally {
        contextDeadline.dispose();
    }
};

type CredentialContextDeferredStage = NonNullable<SafeLogMetrics['contextStage']>;

const completeCredentialContext = async (
    topic: string,
    did: string,
    threadId: string,
    opening: OpeningCredentialContext,
    startup: StartupRequest,
    timing: RequestTiming,
    ownerSignal: AbortSignal
): Promise<void> => {
    if (opening.status !== 'pending') {
        sendForCurrentStartup(did, startup.requestId, startup.ws, {
            event: 'credentials_for_topic',
            credentials: opening.contexts,
        });
        return;
    }

    return asCredentialContextRead(did, () =>
        deferCredentialContext(topic, did, threadId, startup, timing, ownerSignal)
    );
};

const deferCredentialContext = async (
    topic: string,
    did: string,
    threadId: string,
    startup: StartupRequest,
    timing: RequestTiming,
    ownerSignal: AbortSignal
): Promise<void> => {
    const completionStartedAt = performance.now();
    // Its own bound: what the plan left of its deadline can be almost nothing.
    const deferredDeadlineAt = Math.max(
        startup.deadlineAt,
        completionStartedAt + DEFERRED_CONTEXT_MIN_BUDGET_MS
    );
    // The context belongs to the thread, which outlives this socket and this
    // startup: a closed socket or a newer start does not throw away a search
    // still inside its own budget. Erasure still stops it through the owner
    // operation's signal, and sends to a stale startup are dropped.
    const deferredDeadline = createDeadlineSignal(ownerSignal, deferredDeadlineAt);
    const bound = {
        signal: deferredDeadline.signal,
        deadlineAt: deferredDeadlineAt,
    };
    let ingestionWaitMs = 0;
    let candidateCount = 0;
    let filteredCount = 0;
    let lowestScore: number | undefined;
    let highestScore: number | undefined;
    let highestStrongestScore: number | undefined;
    let highestAverageScore: number | undefined;
    let maxMatchCount: number | undefined;
    // How far the deferred phase got, for its server log event.
    let stage: CredentialContextDeferredStage = 'refresh';

    try {
        await refreshCredentialIngestionState(did);
        const remainingBeforeWait = getBoundRemainingMs(bound);

        if (isCredentialIngestionPending(did)) {
            stage = 'ingestion_wait';
            const waitStartedAt = performance.now();
            await waitForCredentialIngestion(
                did,
                Math.min(
                    CREDENTIAL_INGESTION_STARTUP_WAIT_MS,
                    Math.max(0, remainingBeforeWait - 1000)
                )
            );
            ingestionWaitMs = Math.round(performance.now() - waitStartedAt);
        }

        getBoundRemainingMs(bound);
        stage = 'search';
        const contexts = await searchCredentialContextsByTopic(topic, did, {
            limit: 5,
            expandQueries: detectProvider(TITLE_MODEL) !== 'google',
            signal: bound.signal,
            deadlineAt: bound.deadlineAt,
            onMetrics: metrics => {
                candidateCount = metrics.candidateCount;
                filteredCount = metrics.filteredCount;
                lowestScore = metrics.lowestScore;
                highestScore = metrics.highestScore;
                highestStrongestScore = metrics.highestStrongestScore;
                highestAverageScore = metrics.highestAverageScore;
                maxMatchCount = metrics.maxMatchCount;
            },
        });
        getBoundRemainingMs(bound);
        stage = 'store';
        await db.storeThreadCredentials(did, threadId, contexts);
        stage = 'complete';

        const status = contexts.length > 0 ? 'ready' : 'empty';
        logSafeEvent('info', 'credential_context_deferred_completed', {
            contextOutcome: status,
            contextStage: stage,
            count: contexts.length,
            candidateCount,
            durationMs: Math.round(performance.now() - completionStartedAt),
        });
        timing.mark('credential_context.deferred_complete', {
            outcome: status,
            count: contexts.length,
            candidateCount,
            filteredCount,
            lowestScore,
            highestScore,
            highestStrongestScore,
            highestAverageScore,
            maxMatchCount,
            ingestionWaitMs,
            durationMs: Math.round(performance.now() - completionStartedAt),
            ingestionPhase: getCredentialIngestionState(did)?.phase,
        });
        sendCredentialContextStatus(did, startup, threadId, status, contexts.length);
        sendForCurrentStartup(did, startup.requestId, startup.ws, {
            event: 'credentials_for_topic',
            credentials: contexts,
        });
    } catch (error) {
        const failureOutcome =
            bound.signal.aborted && !isTimeoutError(error)
                ? isTimeoutError(bound.signal.reason)
                    ? 'timeout'
                    : 'aborted'
                : getCredentialContextFailureOutcome(error);
        const aborted = isAbortError(error) || bound.signal.aborted;
        logSafeEvent('warn', 'credential_context_deferred_completed', {
            contextOutcome: aborted && failureOutcome === 'error' ? 'aborted' : failureOutcome,
            contextStage: stage,
            count: 0,
            candidateCount,
            durationMs: Math.round(performance.now() - completionStartedAt),
        });

        if (aborted) {
            // Still report how the deferred search ended before handing the abort on.
            timing.mark('credential_context.deferred_complete', {
                outcome: failureOutcome === 'error' ? 'aborted' : failureOutcome,
                count: 0,
                candidateCount,
                filteredCount,
                ingestionWaitMs,
                durationMs: Math.round(performance.now() - completionStartedAt),
                ingestionPhase: getCredentialIngestionState(did)?.phase,
            });
            throw error;
        }

        if (failureOutcome === 'error')
            logCredentialContextFailure(
                error,
                'deferred',
                Math.round(performance.now() - completionStartedAt),
                candidateCount
            );
        await db.setThreadCredentialContextState(threadId, did, 'error', topic);
        timing.mark('credential_context.deferred_complete', {
            outcome: failureOutcome,
            count: 0,
            candidateCount,
            filteredCount,
            ingestionWaitMs,
            durationMs: Math.round(performance.now() - completionStartedAt),
            ingestionPhase: getCredentialIngestionState(did)?.phase,
        });
        sendCredentialContextStatus(did, startup, threadId, 'error', 0);
        console.error('Credential context completion failed:', error);
    } finally {
        deferredDeadline.dispose();
    }
};

const STARTUP_FAILURE_CODES = {
    AiConsentError: 'consent_denied',
    AiAuditPersistenceError: 'audit_unavailable',
    BedrockPrivacyError: 'guardrail_unavailable',
    BedrockConfigurationError: 'guardrail_configuration',
    UnsupportedPrivacyLanguageError: 'unsupported_language',
    DataErasureRequestedError: 'owner_operation_unavailable',
    ZodError: 'invalid_provider_response',
    SyntaxError: 'invalid_provider_response',
    TimeoutError: 'request_timeout',
    AbortError: 'request_aborted',
} as const;

const sendStartupError = (did: string, startup: StartupRequest, error: unknown): void => {
    if (!isStartupOwner(did, startup.requestId, startup.ws)) return;
    // Normalize only known classes/codes. Never forward messages, causes, IDs,
    // schema issues, or provider response bodies to the logging sink.
    const providerError = isAiProviderError(error) ? error : undefined;
    const detail = providerError?.cause instanceof Error ? providerError.cause : error;
    const metadata =
        detail instanceof Error
            ? Object.getOwnPropertyDescriptor(detail, '$metadata')?.value
            : undefined;
    const status =
        detail instanceof Error
            ? (Object.getOwnPropertyDescriptor(detail, 'status')?.value ??
              (metadata !== null && typeof metadata === 'object'
                  ? Object.getOwnPropertyDescriptor(metadata, 'httpStatusCode')?.value
                  : undefined))
            : undefined;
    let failureCode: SafeLogMetrics['failureCode'] = providerError?.code ?? 'unknown';
    // OpenAI's SDK subclasses inherit name="Error"; use their actual identity.
    if (detail instanceof OpenAI.APIConnectionTimeoutError) {
        failureCode = 'request_timeout';
    } else if (detail instanceof OpenAI.APIUserAbortError) {
        failureCode = 'request_aborted';
    } else if (
        detail instanceof OpenAI.APIError ||
        (providerError?.provider === 'bedrock' && typeof status === 'number')
    ) {
        switch (status) {
            case 400:
            case 422:
                failureCode = 'provider_request_rejected';
                break;
            case 401:
            case 403:
                failureCode = 'provider_access_denied';
                break;
            case 404:
                failureCode = 'provider_resource_not_found';
                break;
        }
    } else if (detail instanceof Error && Object.hasOwn(STARTUP_FAILURE_CODES, detail.name)) {
        failureCode = STARTUP_FAILURE_CODES[detail.name as keyof typeof STARTUP_FAILURE_CODES];
    } else {
        failureCode = classifyLearnCardFailure(detail) ?? failureCode;
    }
    logSafeEvent('error', 'ai_session_start_failed', {
        failureCode,
        ...(providerError?.provider === 'openai' ||
        providerError?.provider === 'anthropic' ||
        providerError?.provider === 'google' ||
        providerError?.provider === 'bedrock'
            ? { provider: providerError.provider }
            : {}),
        httpStatus:
            typeof status === 'number' && status >= 100 && status <= 599
                ? status
                : providerError?.httpStatus,
        // Enums only: what LearnCard failed with and, for init, why.
        ...(failureCode.startsWith('learncard_') ? learnCardFailureLogFields(detail) : {}),
    });
    const timedOut =
        startup.signal.aborted || performance.now() >= startup.deadlineAt || isTimeoutError(error);
    if (isAiProviderError(error)) {
        safeSend(
            startup.ws,
            toAiErrorPayload(error, {
                operation: 'session_start',
                requestId: startup.requestId,
            })
        );
        clearCurrentStartup(did, startup.requestId, startup.ws);

        return;
    }

    safeSend(startup.ws, {
        event: 'session_start_error',
        requestId: startup.requestId,
        code: timedOut ? 'plan_timeout' : 'start_failed',
        error: 'Something went wrong. Please try again.',
    });
    clearCurrentStartup(did, startup.requestId, startup.ws);
};

export const websocketHandler = {
    // Retain the most recently opened socket for DID-scoped debug/preload events.
    clients: new Map<string, ChatSocket>(),

    async message(ws: ChatSocket, message: string | Buffer) {
        const receivedAt = performance.now();
        const did = ws.data.did;
        let interactionThreadId: string | undefined;
        let interactionCompleted = false;
        let claimedPlanThreadId: string | undefined;

        try {
            return await withOwnerOperation(did, async () => {
                try {
                    const data = AuthenticatedMessageValidator.parse(
                        JSON.parse(message.toString())
                    );
                    console.log(`Processing message from DID: ${did}`);

                    const threadID = data.threadId;

                    if (threadID && !(await db.hasThread(did, threadID))) {
                        ws.send(JSON.stringify({ error: 'not_found' }));
                        return;
                    }

                    const dedupeKey =
                        data.action === 'start_topic' && data.topic
                            ? JSON.stringify([
                                  data.topic,
                                  data.mode || AiSessionMode.tutor,
                                  data.introStreamMode ?? null,
                                  threadID ?? null,
                              ])
                            : undefined;
                    const duplicate = findDuplicateStartup(did, ws, dedupeKey, receivedAt);
                    if (duplicate) {
                        // The live startup already answers this socket; acknowledge it.
                        safeSend(ws, {
                            event: 'session_start_accepted',
                            requestId: duplicate.requestId,
                        });
                        return;
                    }
                    const startup =
                        data.action && PLAN_START_ACTIONS.has(data.action)
                            ? beginStartup(did, ws, receivedAt, dedupeKey)
                            : undefined;

                    if (threadID) associateThreadClient(ws, threadID);
                    let threadMode = data.mode || AiSessionMode.tutor;

                    // Close Insights Session
                    if (data.action === 'close_insights_session' && threadID) {
                        // clean up thread on close
                        await db.deleteThread(did, threadID);
                        ws.send(JSON.stringify({ event: 'insights_session_closed' }));
                        return;
                    }

                    // If thread already exists, use the mode from the database
                    if (threadID) {
                        threadMode = (await db.getThreadMode(did, threadID)) ?? AiSessionMode.tutor;

                        if (threadMode === AiSessionMode.insights) {
                            await handleInsightsChat(ws, did, threadID, data);

                            return;
                        }
                    }

                    // New Insights Session Start
                    if (threadMode === AiSessionMode.insights) {
                        // Create thread if none exists yet
                        const newThreadId =
                            threadID ||
                            (await createActiveSessionThread(
                                did,
                                data.topic || 'Insights',
                                () => ws.readyState === WebSocket.OPEN,
                                threadIds => notifyReplacedThreads(did, threadIds, ws),
                                AiSessionMode.insights
                            ));
                        associateThreadClient(ws, newThreadId);

                        // initialize insights thread
                        if (!threadID) {
                            // get credentials for topic | context
                            void withOwnerOperation(
                                did,
                                async () => {
                                    try {
                                        const credResults = await searchCredentialsByTopic(
                                            data.topic ?? 'Insights',
                                            did,
                                            { limit: 10 }
                                        );
                                        await db.storeThreadCredentials(
                                            did,
                                            newThreadId,
                                            credResults
                                        );

                                        ws.send(
                                            JSON.stringify({
                                                event: 'credentials_for_topic',
                                                credentials: credResults,
                                            })
                                        );
                                    } catch (error) {
                                        console.error('Error searching credentials:', error);
                                    }
                                },
                                { detached: true }
                            ).catch(() => logSafeEvent('error', 'background_job_failed'));

                            // Tell client thread is ready
                            ws.send(
                                JSON.stringify({
                                    event: 'insights_ready',
                                    threadId: newThreadId,
                                })
                            );
                        }

                        // handle insights chat
                        await handleInsightsChat(ws, did, newThreadId, data);

                        return;
                    }

                    // Handle learning pathway credential
                    if (
                        data.action === 'start_learning_pathway' &&
                        data.topicUri &&
                        data.pathwayUri
                    ) {
                        const streamMode = data.introStreamMode ?? 'formatted';

                        if (!startup) return;

                        const requestTiming = createStartupTiming(did, startup, data.action);

                        requestTiming.mark('session.received');

                        try {
                            getStartupRemainingMs(did, startup);

                            // Independent, so the ownership read overlaps a cold init.
                            const [learnCard, ownsTopic] = await Promise.all([
                                getLearnCard(),
                                db.ownsBoost(did, data.topicUri),
                            ]);
                            if (!ownsTopic) throw new Error('Topic boost not found');

                            getStartupRemainingMs(did, startup);

                            const [
                                topicMetadata,
                                pathwayMetadata,
                                topicCredential,
                                pathwayCredential,
                                pathwayParents,
                            ] = await Promise.all([
                                learnCard.invoke.getBoost(data.topicUri),
                                learnCard.invoke.getBoost(data.pathwayUri),
                                readOwnedBoostCredential(did, data.topicUri),
                                readOwnedBoostCredential(did, data.pathwayUri),
                                learnCard.invoke.getBoostParents(data.pathwayUri, {
                                    limit: 100,
                                    numberOfGenerations: 1,
                                }),
                            ]);
                            const topicBoost = { ...topicMetadata, boost: topicCredential };
                            const pathwayBoost = {
                                ...pathwayMetadata,
                                boost: pathwayCredential,
                            };

                            if (
                                !pathwayParents.records.some(parent => parent.uri === data.topicUri)
                            ) {
                                throw new Error('Learning pathway does not belong to topic');
                            }

                            getStartupRemainingMs(did, startup);

                            if (!topicBoost) throw new Error('Topic boost not found');
                            if (!pathwayBoost) throw new Error('Learning pathway boost not found');

                            const vc = pathwayBoost.boost;

                            if (!vc) {
                                throw new Error(
                                    'No credential found in the learning pathway boost'
                                );
                            }

                            const pathwayData = vc.learningPathway;

                            if (!pathwayData) {
                                throw new Error('Invalid learning pathway credential format');
                            }

                            const step = pathwayData.step;
                            const summary = pathwayData.summary || { skills: [] };
                            const skills = Array.isArray(summary.skills)
                                ? summary.skills
                                      .map((skill: unknown) =>
                                          skill && typeof skill === 'object' && 'title' in skill
                                              ? String(skill.title)
                                              : ''
                                      )
                                      .filter(Boolean)
                                : [];
                            const pathwayTitle = step.title || 'Learning Pathway Step';
                            const planThreadId = await createActiveSessionThread(
                                did,
                                pathwayTitle,
                                () => isCurrentStartup(did, startup.requestId, ws),
                                threadIds => notifyReplacedThreads(did, threadIds, ws)
                            );

                            getStartupRemainingMs(did, startup);
                            requestTiming.mark('credential_context.complete', {
                                outcome: 'empty',
                                count: 0,
                                embeddingTextsFromCache: false,
                            });

                            const planSystemPrompt = `
            Create a structured learning session plan based on the following topic and learning pathway:
            Topic Boost: ${JSON.stringify(topicBoost, null, 2)}
            Learning Pathway Step:
            Title: ${step.title || 'Learning Pathway Step'}
            Description: ${step.description || 'No description provided'}
            Skills: ${skills.join(', ') || 'No specific skills listed'}
            Create a plan that connects the topic with this learning pathway step. Focus on one core learning objective and produce a small roadmap with 2-3 steps.
          `;
                            let planData: SessionPlanData;

                            if (streamMode === 'structured') {
                                planData = await streamStructuredPlanGeneration(
                                    ws,
                                    did,
                                    startup,
                                    planSystemPrompt,
                                    `Create a learning plan for: ${pathwayTitle}`,
                                    requestTiming,
                                    getStartupRemainingMs(did, startup)
                                );
                            } else {
                                requestTiming.mark('plan.stream_open', {
                                    model: PLANNING_MODEL,
                                    provider: detectProvider(PLANNING_MODEL),
                                });

                                planData = await aiCall({
                                    model: PLANNING_MODEL,
                                    systemPrompt: planSystemPrompt,
                                    message: `Create a learning plan for: ${pathwayTitle}`,
                                    output: SessionPlanDataValidator,
                                    signal: startup.signal,
                                    timeoutMs: getStartupRemainingMs(did, startup),
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            requestTiming.mark('plan.complete', {
                                model: PLANNING_MODEL,
                                provider: detectProvider(PLANNING_MODEL),
                            });

                            let formattedPlan: string;

                            if (streamMode === 'structured') {
                                await streamStructuredPlan(
                                    ws,
                                    did,
                                    startup,
                                    pathwayTitle,
                                    planData,
                                    requestTiming
                                );
                                formattedPlan = formatSessionPlanMarkdown(planData);
                            } else {
                                formattedPlan = await streamingAiCall({
                                    model: FORMATTING_MODEL,
                                    systemPrompt:
                                        'Format the session plan JSON as motivational Markdown with welcome, summary, "Objectives", "Skills You Can Earn", and a concise 2-3 step roadmap.',
                                    message: JSON.stringify(planData),
                                    options: {
                                        onChunk: chunk => {
                                            if (!chunk) return;

                                            requestTiming.markFirstDelta({
                                                model: FORMATTING_MODEL,
                                                provider: detectProvider(FORMATTING_MODEL),
                                            });

                                            if (
                                                !sendForCurrentStartup(
                                                    did,
                                                    startup.requestId,
                                                    ws,
                                                    chunk
                                                )
                                            ) {
                                                startup.controller.abort();
                                            }
                                        },
                                        accumulateContent: true,
                                        signal: startup.signal,
                                        timeoutMs: getStartupRemainingMs(did, startup),
                                    },
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            await db.storeThreadPlan(did, planThreadId, JSON.stringify(planData));
                            getStartupRemainingMs(did, startup);

                            const assistantMessage: ChatMessage = {
                                role: 'assistant',
                                content: formattedPlan,
                            };

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_intro',
                                    content: assistantMessage.content,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            requestTiming.mark('session.ready');

                            associateThreadClient(ws, planThreadId);

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_ready',
                                    threadId: planThreadId,
                                    title: pathwayTitle,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            void withOwnerOperation(
                                did,
                                () =>
                                    Promise.all([
                                        db.updateThreadTitle(did, planThreadId, pathwayTitle),
                                        db.updateThreadTopicCredentialUri(
                                            did,
                                            planThreadId,
                                            data.topicUri!
                                        ),
                                        db.addMessage(did, planThreadId, assistantMessage),
                                    ]).catch(error =>
                                        console.error(
                                            'Background thread persistence failed:',
                                            error
                                        )
                                    ),
                                { detached: true }
                            ).catch(() => logSafeEvent('error', 'background_job_failed'));

                            clearCurrentStartup(did, startup.requestId, ws);

                            return;
                        } catch (error) {
                            if (
                                isAbortError(error) &&
                                !isStartupOwner(did, startup.requestId, ws)
                            ) {
                                return;
                            }

                            console.error('Error processing learning pathway:', error);
                            sendStartupError(did, startup, error);

                            return;
                        }
                    }

                    // Handle start_topic_uri action
                    if (data.action === 'start_topic_uri' && data.topicUri) {
                        const streamMode = data.introStreamMode ?? 'formatted';

                        if (!startup) return;

                        const requestTiming = createStartupTiming(did, startup, data.action);

                        requestTiming.mark('session.received');

                        try {
                            getStartupRemainingMs(did, startup);

                            // Independent, so the ownership read overlaps a cold init.
                            const [learnCard, ownsTopic] = await Promise.all([
                                getLearnCard(),
                                db.ownsBoost(did, data.topicUri),
                            ]);
                            if (!ownsTopic) throw new Error('Topic boost not found');

                            getStartupRemainingMs(did, startup);

                            const [topicMetadata, topicCredential] = await Promise.all([
                                learnCard.invoke.getBoost(data.topicUri),
                                readOwnedBoostCredential(did, data.topicUri),
                            ]);
                            const topicBoost = { ...topicMetadata, boost: topicCredential };

                            getStartupRemainingMs(did, startup);

                            if (!topicBoost) throw new Error('Topic boost not found');

                            const topicInfo: unknown = topicCredential.topicInfo;
                            if (
                                !topicInfo ||
                                typeof topicInfo !== 'object' ||
                                !('title' in topicInfo) ||
                                typeof topicInfo.title !== 'string'
                            ) {
                                throw new Error('Invalid topic credential format');
                            }
                            const topicTitle = topicInfo.title;
                            const threadPromise = createActiveSessionThread(
                                did,
                                topicTitle,
                                () => isCurrentStartup(did, startup.requestId, ws),
                                threadIds => notifyReplacedThreads(did, threadIds, ws)
                            );
                            const { threadId: planThreadId, opening } =
                                await resolveOpeningCredentialContext(
                                    topicTitle,
                                    did,
                                    threadPromise,
                                    startup,
                                    requestTiming
                                );
                            const vcContext = opening.contexts
                                .map(
                                    result =>
                                        `- ${result.context} (score: ${result.score.toFixed(2)})`
                                )
                                .join('\n');
                            const planSystemPrompt = `
            Create a structured learning session plan based on the following topic boost: ${JSON.stringify(topicBoost)}
            The user's existing credentials:
            ${vcContext}
            Focus on one core learning objective and produce a small roadmap with 2-3 steps.
          `;
                            let planData: SessionPlanData;

                            if (streamMode === 'structured') {
                                planData = await streamStructuredPlanGeneration(
                                    ws,
                                    did,
                                    startup,
                                    planSystemPrompt,
                                    topicTitle,
                                    requestTiming,
                                    getStartupRemainingMs(did, startup)
                                );
                            } else {
                                requestTiming.mark('plan.stream_open', {
                                    model: PLANNING_MODEL,
                                    provider: detectProvider(PLANNING_MODEL),
                                });

                                planData = await aiCall({
                                    model: PLANNING_MODEL,
                                    systemPrompt: planSystemPrompt,
                                    message: topicTitle,
                                    output: SessionPlanDataValidator,
                                    signal: startup.signal,
                                    timeoutMs: getStartupRemainingMs(did, startup),
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            requestTiming.mark('plan.complete', {
                                model: PLANNING_MODEL,
                                provider: detectProvider(PLANNING_MODEL),
                            });

                            let formattedPlan: string;

                            if (streamMode === 'structured') {
                                await streamStructuredPlan(
                                    ws,
                                    did,
                                    startup,
                                    topicTitle,
                                    planData,
                                    requestTiming
                                );
                                formattedPlan = formatSessionPlanMarkdown(planData);
                            } else {
                                formattedPlan = await streamingAiCall({
                                    model: FORMATTING_MODEL,
                                    systemPrompt:
                                        'Format the session plan JSON as motivational Markdown with welcome, summary, "Objectives", "Skills You Can Earn", and a concise 2-3 step roadmap.',
                                    message: JSON.stringify(planData),
                                    options: {
                                        onChunk: chunk => {
                                            if (!chunk) return;

                                            requestTiming.markFirstDelta({
                                                model: FORMATTING_MODEL,
                                                provider: detectProvider(FORMATTING_MODEL),
                                            });

                                            if (
                                                !sendForCurrentStartup(
                                                    did,
                                                    startup.requestId,
                                                    ws,
                                                    chunk
                                                )
                                            ) {
                                                startup.controller.abort();
                                            }
                                        },
                                        accumulateContent: true,
                                        signal: startup.signal,
                                        timeoutMs: getStartupRemainingMs(did, startup),
                                    },
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            await db.storeThreadPlan(did, planThreadId, JSON.stringify(planData));
                            getStartupRemainingMs(did, startup);

                            const assistantMessage: ChatMessage = {
                                role: 'assistant',
                                content: formattedPlan,
                            };

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_intro',
                                    content: assistantMessage.content,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            requestTiming.mark('session.ready');

                            associateThreadClient(ws, planThreadId);

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_ready',
                                    threadId: planThreadId,
                                    title: topicTitle,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            void withOwnerOperation(
                                did,
                                () =>
                                    Promise.all([
                                        db.updateThreadTitle(did, planThreadId, topicTitle),
                                        db.updateThreadTopicCredentialUri(
                                            did,
                                            planThreadId,
                                            data.topicUri!
                                        ),
                                        db.addMessage(did, planThreadId, assistantMessage),
                                    ]).catch(error =>
                                        console.error(
                                            'Background thread persistence failed:',
                                            error
                                        )
                                    ),
                                { detached: true }
                            ).catch(() => logSafeEvent('error', 'background_job_failed'));

                            const credentialCompletion = withOwnerOperation(
                                did,
                                signal =>
                                    completeCredentialContext(
                                        topicTitle,
                                        did,
                                        planThreadId,
                                        opening,
                                        startup,
                                        requestTiming,
                                        signal
                                    ),
                                { detached: true }
                            );
                            threadCredentialCompletions.set(planThreadId, credentialCompletion);
                            void credentialCompletion
                                .catch(error => {
                                    if (!isAbortError(error)) {
                                        console.error('Credential completion failed:', error);
                                    }
                                })
                                .finally(() => {
                                    if (
                                        threadCredentialCompletions.get(planThreadId) ===
                                        credentialCompletion
                                    ) {
                                        threadCredentialCompletions.delete(planThreadId);
                                    }

                                    clearCurrentStartup(did, startup.requestId, ws);
                                });

                            return;
                        } catch (error) {
                            if (
                                isAbortError(error) &&
                                !isStartupOwner(did, startup.requestId, ws)
                            ) {
                                return;
                            }

                            console.error('Error starting topic with URI:', error);
                            sendStartupError(did, startup, error);

                            return;
                        }
                    }

                    // Handle start_topic action
                    if (data.action === 'start_topic' && data.topic) {
                        const topic = data.topic;
                        const streamMode = data.introStreamMode ?? 'formatted';

                        if (!startup) return;

                        const requestTiming = createStartupTiming(did, startup, data.action);

                        requestTiming.mark('session.received');

                        if (detectProvider(TITLE_MODEL) !== 'google') {
                            /* Warm the query expansion the deferred search will use, while
                 the opening and the plan run. Best effort: on any failure the
                 deferred search generates it itself. */
                            void withOwnerOperation(
                                did,
                                () =>
                                    warmCredentialTopicExpansion(topic, did, {
                                        signal: AbortSignal.any([
                                            startup.controller.signal,
                                            AbortSignal.timeout(DEFERRED_CONTEXT_MIN_BUDGET_MS),
                                        ]),
                                    }),
                                { detached: true }
                            ).catch(() => undefined);
                        }

                        try {
                            const threadPromise = createActiveSessionThread(
                                did,
                                topic,
                                () => isCurrentStartup(did, startup.requestId, ws),
                                threadIds => notifyReplacedThreads(did, threadIds, ws)
                            );
                            const { threadId: planThreadId, opening } =
                                await resolveOpeningCredentialContext(
                                    topic,
                                    did,
                                    threadPromise,
                                    startup,
                                    requestTiming
                                );
                            const vcContext = opening.contexts
                                .map(
                                    result =>
                                        `- ${result.context} (score: ${result.score.toFixed(2)})`
                                )
                                .join('\n');
                            const planSystemPrompt = `Create a structured learning session plan based on the topic: ${topic}\n\nThe user's existing credentials:\n${vcContext}\n\nFocus on one core learning objective and produce a small roadmap with 2-3 steps.`;
                            let planData: SessionPlanData;

                            if (streamMode === 'structured') {
                                planData = await streamStructuredPlanGeneration(
                                    ws,
                                    did,
                                    startup,
                                    planSystemPrompt,
                                    topic,
                                    requestTiming,
                                    getStartupRemainingMs(did, startup)
                                );
                            } else {
                                requestTiming.mark('plan.stream_open', {
                                    model: PLANNING_MODEL,
                                    provider: detectProvider(PLANNING_MODEL),
                                });

                                planData = await aiCall({
                                    model: PLANNING_MODEL,
                                    systemPrompt: planSystemPrompt,
                                    message: topic,
                                    output: SessionPlanDataValidator,
                                    signal: startup.signal,
                                    timeoutMs: getStartupRemainingMs(did, startup),
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            requestTiming.mark('plan.complete', {
                                model: PLANNING_MODEL,
                                provider: detectProvider(PLANNING_MODEL),
                            });

                            let formattedPlan: string;

                            if (streamMode === 'structured') {
                                await streamStructuredPlan(
                                    ws,
                                    did,
                                    startup,
                                    topic,
                                    planData,
                                    requestTiming
                                );
                                formattedPlan = formatSessionPlanMarkdown(planData);
                            } else {
                                formattedPlan = await streamingAiCall({
                                    model: FORMATTING_MODEL,
                                    systemPrompt:
                                        'Format the session plan JSON as motivational Markdown with welcome, summary, "Objectives", "Skills You Can Earn", and a concise 2-3 step roadmap.',
                                    message: JSON.stringify(planData),
                                    options: {
                                        onChunk: chunk => {
                                            if (!chunk) return;

                                            requestTiming.markFirstDelta({
                                                model: FORMATTING_MODEL,
                                                provider: detectProvider(FORMATTING_MODEL),
                                            });

                                            if (
                                                !sendForCurrentStartup(
                                                    did,
                                                    startup.requestId,
                                                    ws,
                                                    chunk
                                                )
                                            ) {
                                                startup.controller.abort();
                                            }
                                        },
                                        accumulateContent: true,
                                        signal: startup.signal,
                                        timeoutMs: getStartupRemainingMs(did, startup),
                                    },
                                });
                            }

                            getStartupRemainingMs(did, startup);
                            await db.storeThreadPlan(did, planThreadId, JSON.stringify(planData));
                            getStartupRemainingMs(did, startup);

                            const assistantMessage: ChatMessage = {
                                role: 'assistant',
                                content: formattedPlan,
                            };

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_intro',
                                    content: assistantMessage.content,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            requestTiming.mark('session.ready');

                            associateThreadClient(ws, planThreadId);

                            if (
                                !sendForCurrentStartup(did, startup.requestId, ws, {
                                    event: 'plan_ready',
                                    threadId: planThreadId,
                                    title: topic,
                                })
                            ) {
                                throw new DOMException('Session start superseded', 'AbortError');
                            }

                            void withOwnerOperation(
                                did,
                                () =>
                                    Promise.all([
                                        db.updateThreadTitle(did, planThreadId, topic),
                                        db.addMessage(did, planThreadId, assistantMessage),
                                    ]).catch(error =>
                                        console.error(
                                            'Background thread persistence failed:',
                                            error
                                        )
                                    ),
                                { detached: true }
                            ).catch(() => logSafeEvent('error', 'background_job_failed'));

                            const credentialCompletion = withOwnerOperation(
                                did,
                                signal =>
                                    completeCredentialContext(
                                        topic,
                                        did,
                                        planThreadId,
                                        opening,
                                        startup,
                                        requestTiming,
                                        signal
                                    ),
                                { detached: true }
                            );
                            threadCredentialCompletions.set(planThreadId, credentialCompletion);
                            void credentialCompletion
                                .catch(error => {
                                    if (!isAbortError(error)) {
                                        console.error('Credential completion failed:', error);
                                    }
                                })
                                .finally(() => {
                                    if (
                                        threadCredentialCompletions.get(planThreadId) ===
                                        credentialCompletion
                                    ) {
                                        threadCredentialCompletions.delete(planThreadId);
                                    }

                                    clearCurrentStartup(did, startup.requestId, ws);
                                });

                            publicationOwners.set(did, startup);
                            sendToThreadClients(did, planThreadId, {
                                event: 'topic_publication_status',
                                threadId: planThreadId,
                                status: 'pending',
                            });

                            const publicationCompletion = withOwnerOperation(
                                did,
                                async () => {
                                    getPublicationRemainingMs(did, startup);

                                    const learnCard = await getLearnCard();

                                    getPublicationRemainingMs(did, startup);

                                    const unsignedVc = createTopicVCStructure(
                                        learnCard.id.did(),
                                        did,
                                        topic,
                                        planThreadId
                                    );
                                    const { boostUri: topicCredentialUri } =
                                        await createAndPublishBoostCredential({
                                            unsignedVc,
                                            did,
                                            boostOptions: {
                                                status: 'LIVE',
                                                category: 'ai-topic',
                                            },
                                            beforeRemoteOperation: () => {
                                                getPublicationRemainingMs(did, startup);
                                            },
                                        });

                                    getPublicationRemainingMs(did, startup);
                                    await db.updateThreadTopicCredentialUri(
                                        did,
                                        planThreadId,
                                        topicCredentialUri
                                    );

                                    if (publicationOwners.get(did) === startup) {
                                        sendToThreadClients(did, planThreadId, {
                                            event: 'topic_publication_status',
                                            threadId: planThreadId,
                                            status: 'ready',
                                        });
                                    }
                                },
                                { detached: true }
                            );
                            void publicationCompletion
                                .catch(error => {
                                    if (isAbortError(error)) return;

                                    console.error('Topic publication failed:', error);

                                    if (publicationOwners.get(did) === startup) {
                                        sendToThreadClients(did, planThreadId, {
                                            event: 'topic_publication_status',
                                            threadId: planThreadId,
                                            status: 'error',
                                        });
                                    }
                                })
                                .finally(() => {
                                    if (publicationOwners.get(did) === startup) {
                                        publicationOwners.delete(did);
                                    }
                                });

                            return;
                        } catch (error) {
                            if (
                                isAbortError(error) &&
                                !isStartupOwner(did, startup.requestId, ws)
                            ) {
                                return;
                            }

                            console.error('Error starting topic:', error);
                            sendStartupError(did, startup, error);

                            return;
                        }
                    }

                    // Handle continuation after user clicks 'Ok' to start roadmap
                    if (data.action === 'continue_plan' && data.threadId) {
                        if (await db.isThreadEnded(data.threadId, did)) {
                            ws.send(
                                JSON.stringify({
                                    error: 'Session has already ended',
                                    event: 'session_completed',
                                    threadId: data.threadId,
                                })
                            );
                            return;
                        }

                        if (activeThreadInteractions.has(data.threadId)) {
                            safeSend(ws, {
                                event: 'thread_busy',
                                threadId: data.threadId,
                            });
                            return;
                        }

                        activeThreadInteractions.add(data.threadId);
                        interactionThreadId = data.threadId;

                        // Retrieve stored plan data
                        const planRec = await db.getThreadPlans(did, data.threadId);
                        if (!planRec || planRec.length === 0) {
                            ws.send(JSON.stringify({ error: 'Session plan not found' }));
                            return;
                        }
                        const plan = JSON.parse(planRec[0].plan_data);
                        const firstModule = plan.roadmap[0];

                        if (!(await db.startThreadPlan(data.threadId, did))) {
                            safeSend(ws, {
                                event: 'thread_updated',
                                threadId: data.threadId,
                                phase: 'ready',
                            });
                            interactionCompleted = true;
                            return;
                        }

                        claimedPlanThreadId = data.threadId;
                        sendToThreadClients(
                            did,
                            data.threadId,
                            {
                                event: 'thread_updated',
                                threadId: data.threadId,
                                phase: 'responding',
                            },
                            ws
                        );

                        const credentialState = await db.getThreadCredentialContextState(
                            data.threadId,
                            did
                        );
                        const credentialCompletion = threadCredentialCompletions.get(data.threadId);

                        if (credentialState?.status === 'pending' && credentialCompletion) {
                            await Promise.race([
                                credentialCompletion.catch(() => undefined),
                                Bun.sleep(SESSION_FIRST_MODULE_CONTEXT_WAIT_MS),
                            ]);
                        }

                        // Retrieve stored credential context for thread
                        let vcContext = '';
                        try {
                            const creds = await db.getThreadCredentials(did, data.threadId);
                            vcContext = creds
                                .map(r => `- ${r.context} (score: ${r.score.toFixed(2)})`)
                                .join('\n');
                        } catch (error) {
                            console.error('Error fetching thread credentials:', error);
                        }

                        try {
                            const moduleContent = await streamingAiCall({
                                model: CHAT_MODEL,
                                systemPrompt: `
You are a helpful self-guided learning assistant that uses the Socratic method to prod users to learn.
Your primary goal is to teach and expand the knowledge of the user through thoughtful questions.
Your response should use the Socratic method of always answering every question with a question.
Your response does not need to be a complete answer to the user's question.
Your response does not need to make every sentence a question. In fact it's better to start with some explanation and then ask a question.
Your response should not include the word "socratic" unless it is part of the user's question.
Please use Markdown formatting when appropriate, particularly for code blocks.
You can also use LaTeX (via remark-math and rehype-katex, so all LaTeX _must_ be surrounded by $$) for any mathematical expressions.

Now begin the first module:
## ${firstModule.module}
${firstModule.description}

End with a Socratic question prompting the user to continue.

Context about the user and their credentials:
${vcContext}`,
                                message: JSON.stringify(firstModule),
                                options: {
                                    onChunk: chunk => {
                                        if (chunk) ws.send(JSON.stringify(chunk));
                                    },
                                    accumulateContent: true,
                                },
                            });
                            const moduleMessage: ChatMessage = {
                                role: 'assistant',
                                content: moduleContent ?? '',
                            };
                            await db.addMessage(did, data.threadId, moduleMessage);
                            interactionCompleted = true;
                            safeSend(ws, { done: true, threadId: data.threadId });
                            sendToThreadClients(
                                did,
                                data.threadId,
                                {
                                    event: 'thread_updated',
                                    threadId: data.threadId,
                                    phase: 'ready',
                                },
                                ws
                            );
                        } catch (error) {
                            console.error('Error continuing plan:', error);
                            ws.send(JSON.stringify({ error: 'Failed to continue plan' }));
                        }
                        return;
                    }

                    // Ensure normal messages have content
                    if (!data.message) {
                        ws.send(JSON.stringify({ error: 'Message content required' }));
                        return;
                    }

                    // A generic first message is also a new AI session. Replacing the active
                    // thread here keeps every entry path under the same lifecycle owner.
                    const threadId =
                        data.threadId ??
                        (await createActiveSessionThread(
                            did,
                            'New Topic',
                            () => ws.readyState === WebSocket.OPEN,
                            threadIds => notifyReplacedThreads(did, threadIds, ws)
                        ));
                    let generatedTitle: string | undefined;
                    let topicCredentialUri: string | undefined;

                    associateThreadClient(ws, threadId);

                    // console.log(`Thread ID: ${threadId}`);

                    // Check if this thread already has summaries (session completed)
                    if (data.threadId) {
                        const [isEnded, existingSummaries] = await Promise.all([
                            db.isThreadEnded(threadId, did),
                            db.getThreadSummaryCredentials(did, threadId),
                        ]);
                        if (isEnded || existingSummaries.length > 0) {
                            console.warn(`Rejecting message for completed thread ${threadId}`);
                            ws.send(
                                JSON.stringify({
                                    error: 'Session has already ended',
                                    event: 'session_completed',
                                    threadId,
                                })
                            );
                            return;
                        }
                    }

                    if (activeThreadInteractions.has(threadId)) {
                        safeSend(ws, {
                            event: 'thread_busy',
                            threadId,
                        });
                        return;
                    }

                    activeThreadInteractions.add(threadId);
                    interactionThreadId = threadId;

                    if (!data.threadId) {
                        let topicTitle = 'New Topic';

                        if (data.message.content) {
                            try {
                                topicTitle = await streamingAiCall({
                                    model: TITLE_MODEL,
                                    systemPrompt:
                                        "Generate a concise topic title (2-4 words) for this chat based on the user's first message. Respond with just the title, no quotes or extra text.",
                                    message: data.message.content,
                                });
                            } catch {
                                console.error('Could not generate topic title, using fallback.');
                            }
                        }

                        generatedTitle = topicTitle;
                        await db.updateThreadTitle(did, threadId, generatedTitle);
                    } else {
                        topicCredentialUri = await db.getThreadTopicCredential(did, threadId);
                    }

                    // Store the user message
                    const userMessage = data.message;

                    let messages: (ChatMessage | DBMessage)[] = await db.getModelMessages(
                        did,
                        threadId
                    );

                    // If this is a response to a question, it should be stored as a tool response
                    if (data.selectedQuestion && messages.length > 0) {
                        const previousMessage = messages.at(-1)!;

                        const id = previousMessage.tool_call_id!;

                        const toolMessage: ChatMessage = {
                            role: 'tool',
                            tool_call_id: id,
                            content: data.selectedQuestion ?? '',
                        };

                        await db.addMessage(did, threadId, toolMessage);
                        messages = [...messages, toolMessage];
                    }

                    await db.addMessage(did, threadId, userMessage);
                    messages = [...messages, userMessage];
                    sendToThreadClients(
                        did,
                        threadId,
                        {
                            event: 'thread_updated',
                            threadId,
                            phase: 'responding',
                        },
                        ws
                    );

                    // Prepare formatted messages for AI session completion
                    let formattedForAI: any[] = [];

                    // Award intermediate VC and check plan completion before responding
                    // Awarding disabled for now
                    // awardVc(ws, messages, topicCredentialUri);
                    const plans = await db.getThreadPlans(did, threadId);
                    let planComplete = false;
                    if (plans.length > 0) {
                        const plan = JSON.parse(plans[0].plan_data);
                        formattedForAI = messages.map(msg => {
                            const m: any = { role: msg.role, content: msg.content };
                            if (msg.tool_calls) {
                                m.tool_calls = msg.tool_calls;
                                delete m.content;
                            }
                            if (msg.tool_call_id) {
                                m.tool_call_id = msg.tool_call_id;
                            }
                            return m;
                        });
                        try {
                            const { complete } = await aiCall({
                                model: CHAT_MODEL,
                                systemPrompt: `You are an assessment AI that determines if a learning session should be completed.

Given a session plan with modules/steps and the conversation messages, determine if the user has meaningfully engaged with and progressed through the planned learning objectives.

A session should be marked complete when:
- The user has demonstrated understanding of the key concepts from the plan
- There has been substantial back-and-forth discussion covering the main topics
- The user has shown learning progression across multiple exchanges
- The conversation has naturally reached a good stopping point

A session should NOT be marked complete if:
- Only 1-2 exchanges have occurred
- The user hasn't engaged with the core learning objectives yet
- The conversation is still building momentum on the main topics
- Key modules from the plan haven't been addressed

Be conservative - err on the side of continuing the session unless there's clear evidence of substantial learning completion.

If the user includes "DEBUG_END_SESSION" in their message, mark the session as complete.
`,
                                message: JSON.stringify({ plan, messages: formattedForAI }),
                                output: PlanCompletionValidator,
                            });
                            planComplete = complete;
                        } catch (error) {
                            console.error('Error checking plan completion:', error);
                        }
                    }
                    if (planComplete) {
                        try {
                            // Send summary credential and then a final congratulatory message
                            const [_, finalContent] = await Promise.all([
                                sendConversationSummary(
                                    ws,
                                    did,
                                    messages,
                                    threadId,
                                    topicCredentialUri
                                ),
                                streamingAiCall({
                                    model: CHAT_MODEL,
                                    systemPrompt:
                                        'You are an empathetic AI coach. Write a short congratulatory message acknowledging that the user completed the session plan, summarize their progress, and suggest next steps. Your response must _not_ include any questions.',
                                    message: formattedForAI,
                                    options: {
                                        onChunk: chunk => {
                                            if (chunk) ws.send(JSON.stringify(chunk));
                                        },
                                        accumulateContent: true,
                                    },
                                }),
                            ]);
                            const endMessage: ChatMessage = {
                                role: 'assistant',
                                content: finalContent ?? '',
                            };
                            await db.addMessage(did, threadId, endMessage);
                            // Signal end of stream
                            ws.send(JSON.stringify({ done: true, threadId }));
                        } catch (error) {
                            console.error('Error streaming final message:', error);
                        }
                        return;
                    }

                    let vcContext = '';
                    try {
                        let credResults = await db.getThreadCredentials(did, threadId);
                        const credentialState = await db.getThreadCredentialContextState(
                            threadId,
                            did
                        );

                        if (credentialState.status === undefined && credResults.length === 0) {
                            const claimed = await db.claimThreadCredentialContextSearch(
                                threadId,
                                did,
                                credentialState.title
                            );

                            if (!claimed) {
                                const [latestCredentials] = await Promise.all([
                                    db.getThreadCredentials(did, threadId),
                                    db.getThreadCredentialContextState(threadId, did),
                                ]);

                                credResults = latestCredentials;
                            } else {
                                try {
                                    credResults = await searchCredentialsByTopic(
                                        credentialState.title,
                                        did,
                                        { limit: 5 }
                                    );
                                    await db.storeThreadCredentials(did, threadId, credResults);
                                    safeSend(ws, {
                                        event: 'credentials_for_topic',
                                        credentials: credResults,
                                    });
                                } catch (error) {
                                    await db.setThreadCredentialContextState(
                                        threadId,
                                        did,
                                        'error',
                                        credentialState.title
                                    );
                                    console.error('Legacy credential search failed:', error);
                                }
                            }
                        }
                        vcContext = credResults
                            .map(r => `- ${r.context} (score: ${r.score.toFixed(2)})`)
                            .join('\n');
                    } catch (error) {
                        console.error('Error searching credentials:', error);
                    }

                    // Format messages for the chat API
                    const formattedMessages = messages.map(msg => {
                        // Map the messages properly preserving tool calls and responses
                        const messageObj: any = {
                            role: msg.role,
                            content: msg.content,
                        };

                        // If this is a tool call message
                        if (msg.tool_calls) {
                            messageObj.tool_calls = msg.tool_calls;
                            delete messageObj.content;
                        }

                        // If this is a tool response message
                        if (msg.tool_call_id) {
                            messageObj.tool_call_id = msg.tool_call_id;
                        }

                        return messageObj;
                    });

                    // Initialize assistant message structure
                    const fullContent = await streamingAiCall({
                        model: CHAT_MODEL,
                        systemPrompt: `
You are a helpful self-guided learning assistant that uses the socratic method to prod users to learn.
Your primary goal is to teach and expand on the knowledge of the user through thoughtful questions.
Your response should use the socratic method of always answering every question with a question.
Your response does not need to be a complete answer to the user's question.
Your response does not need to make every sentence a question. In fact it's better to start with some
explanation and then ask a question in most cases.
Your response should not include the word "socratic" unless it is part of the user's question.
Please use markdown formatting when appropriate, particularly for code blocks.
You can also use LaTeX (via remark-math and rehype-katex, so all LaTeX _must_ be surrounded by $$, including inline expressions or expressions that are nested within like a list item or something) for any mathematical expressions.

Context about the user:\n${vcContext}`,
                        message: formattedMessages,
                        options: {
                            // Handle each chunk as it comes in
                            onChunk: content => {
                                if (content) {
                                    // Send each chunk as it arrives
                                    ws.send(JSON.stringify(content));
                                }
                            },
                            // Accumulate content for storage
                            accumulateContent: true,
                        },
                    });

                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: fullContent ?? '',
                    };

                    // Store the complete assistant message
                    await db.addMessage(did, threadId, assistantMessage);
                    sendToThreadClients(
                        did,
                        threadId,
                        {
                            event: 'thread_updated',
                            threadId,
                            phase: 'ready',
                        },
                        ws
                    );
                    interactionCompleted = true;

                    // Send completion only after persistence, including the title for new threads.
                    ws.send(
                        JSON.stringify({
                            done: true,
                            threadId,
                            ...(generatedTitle ? { title: generatedTitle } : {}),
                        })
                    );

                    if (generatedTitle) {
                        void withOwnerOperation(
                            did,
                            async () => {
                                sendToThreadClients(did, threadId, {
                                    event: 'topic_publication_status',
                                    threadId,
                                    status: 'pending',
                                });

                                try {
                                    const learnCard = await getLearnCard();
                                    const unsignedVc = createTopicVCStructure(
                                        learnCard.id.did(),
                                        did,
                                        generatedTitle,
                                        threadId
                                    );
                                    const { boostUri: publishedUri } =
                                        await createAndPublishBoostCredential({
                                            unsignedVc,
                                            did,
                                            boostOptions: {
                                                status: 'LIVE',
                                                category: 'ai-topic',
                                            },
                                        });

                                    await db.updateThreadTopicCredentialUri(
                                        did,
                                        threadId,
                                        publishedUri
                                    );

                                    sendToThreadClients(did, threadId, {
                                        event: 'topic_publication_status',
                                        threadId,
                                        status: 'ready',
                                    });
                                } catch (error) {
                                    console.error('Topic publication failed:', error);
                                    sendToThreadClients(did, threadId, {
                                        event: 'topic_publication_status',
                                        threadId,
                                        status: 'error',
                                    });
                                }
                            },
                            { detached: true }
                        ).catch(() => logSafeEvent('error', 'background_job_failed'));
                    }
                } catch (error: unknown) {
                    if (isDataErasureRequestedError(error)) {
                        safeSend(ws, { error: error.code });
                        ws.close(1008, 'Data erasure requested');

                        return;
                    }

                    if (error instanceof Error && error.name === 'AbortError') return;

                    if (isAiProviderError(error)) {
                        console.warn('AI WebSocket operation failed', {
                            code: error.code,
                            provider: error.provider,
                            threadId: interactionThreadId ?? ws.data.threadId,
                        });
                        safeSend(
                            ws,
                            toAiErrorPayload(error, {
                                operation: 'chat',
                                threadId: interactionThreadId ?? ws.data.threadId,
                            })
                        );
                    } else {
                        const message = error instanceof Error ? error.message : String(error);

                        console.error('Error:', error);
                        safeSend(ws, { error: message });
                    }
                } finally {
                    if (claimedPlanThreadId && !interactionCompleted) {
                        try {
                            await db.resetThreadPlanStarted(claimedPlanThreadId, did);
                        } catch (error) {
                            console.error('Failed to reset session plan state:', error);
                        }
                    }

                    if (interactionThreadId) {
                        if (!interactionCompleted) {
                            sendToThreadClients(did, interactionThreadId, {
                                event: 'thread_updated',
                                threadId: interactionThreadId,
                                phase: 'error',
                            });
                        }

                        activeThreadInteractions.delete(interactionThreadId);
                    }
                }
            });
        } catch (error) {
            if (isDataErasureRequestedError(error)) {
                safeSend(ws, { error: error.code });
                ws.close(1008, 'Data erasure requested');
            } else {
                logSafeEvent('error', 'request_failed');
                safeSend(ws, { error: 'Owner operation unavailable' });
                ws.close(1011, 'Owner operation unavailable');
            }
        }
    },

    async open(ws: ChatSocket) {
        try {
            // Extract DID from the request URL
            const did = ws.data.did;

            if (ws.data.type === 'assessment') {
                // do assessment stuff
            }

            if (!did) {
                ws.send(JSON.stringify({ error: 'Authentication required' }));
                ws.close();
                return;
            }

            // Store the client connection
            await withOwnerOperation(did, async signal => {
                registerOwnerSocket(did, ws);
                this.clients.set(did, ws);
                if (ws.data.threadId) associateThreadClient(ws, ws.data.threadId);
                console.log(`WebSocket connection established for DID: ${did}`);

                // Start the learner's consent snapshot read now, so the opening search
                // and the suggestion preload's plain consent reads join one read. Best
                // effort; loaded lazily to keep the consent module out of this
                // module's static graph.
                void import('../learncard/consent')
                    .then(async ({ prefetchAiConsentSnapshot }) =>
                        prefetchAiConsentSnapshot(await getLearnCard(), did)
                    )
                    .catch(() => undefined);

                // Suggestions are optional; their failure must not close the transport
                // or cancel independently consent-checked planning. Verification remains
                // strict inside getSuggestedTopics and credential-context retrieval.
                try {
                    const { topics, count } = await getSuggestedTopics(did, { signal });
                    if (this.clients.get(did) === ws)
                        safeSend(ws, {
                            event: 'credentials_ready',
                            count,
                            suggestedTopics: topics,
                        });
                } catch (error) {
                    if (isDataErasureRequestedError(error)) throw error;
                    signal.throwIfAborted();
                    const unavailable = error instanceof CredentialVerificationUnavailableError;
                    logSafeEvent('warn', 'credential_preload_failed', {
                        failureCode: unavailable
                            ? 'credential_verification_unavailable'
                            : (classifyLearnCardFailure(error) ?? 'unknown'),
                        ...learnCardFailureLogFields(error),
                        ...verificationSubreasonOf(error),
                    });
                    if (this.clients.get(did) === ws)
                        safeSend(ws, {
                            event: 'credential_preload_error',
                            code: unavailable
                                ? 'credential_verification_unavailable'
                                : 'credential_preload_unavailable',
                        });
                }
            });
        } catch (error) {
            console.error('Error in WebSocket open handler:', error);
            ws.close();
        }
    },

    async close(ws: ChatSocket) {
        try {
            // Clean up job subscriptions for this websocket
            unsubscribeWebSocketFromAllJobs(ws);

            // Find and remove the client
            const did = ws.data.did;
            if (did) {
                unregisterOwnerSocket(did, ws);
                console.log(`WebSocket connection closed for DID: ${did}`);

                const startup = activeStartups.get(did);

                if (startup?.ws === ws) {
                    startup.controller.abort();
                    startupCleanup.get(startup)?.();
                    activeStartups.delete(did);
                }

                const publication = publicationOwners.get(did);

                if (publication?.ws === ws) {
                    publication.controller.abort();
                    publicationOwners.delete(did);
                }

                const threadId = ws.data.threadId;

                if (threadId) {
                    const clients = threadClients.get(threadId);

                    clients?.delete(ws);
                    if (clients?.size === 0) threadClients.delete(threadId);
                }

                if (this.clients.get(did) === ws) {
                    const replacement = [...threadClients.values()]
                        .flatMap(clients => [...clients])
                        .find(
                            client =>
                                client.data.did === did &&
                                client !== ws &&
                                client.readyState === WebSocket.OPEN
                        );

                    if (replacement) {
                        this.clients.set(did, replacement);
                    } else {
                        this.clients.delete(did);
                    }
                }
            } else {
                console.log('WebSocket connection closed for unknown client');
            }
        } catch (error) {
            console.error('Error in WebSocket close handler:', error);
        }
    },
};

export default websocketHandler;
