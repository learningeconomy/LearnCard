import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import type { ServerWebSocket } from 'bun';
import OpenAI from 'openai';
import { ValidationException } from '@aws-sdk/client-bedrock-runtime';
import { AiProviderError } from '../ai/errors';
import type { ExternalArtifact } from '../db';
import type { UnsignedVC, VC } from '@learncard/types';
import { configureProductionLogging } from '../logging';
import { CredentialVerificationUnavailableError } from '../credentials/verification';
import { TRPCClientError } from '@trpc/client';
import { LearnCardTimeoutError, LearnCardUnavailableError } from '../learncard/errors';
import { markCredentialItemFailure } from '../credentials/batch';

const plan = {
    welcome: 'Welcome',
    summary: 'Summary',
    objectives: ['Objective'],
    skills: ['Skill'],
    roadmap: [
        {
            module: 'Module',
            description: 'Description',
            learningObjectives: ['Learn'],
        },
    ],
};
const planJson = JSON.stringify(plan);
const operations: string[] = [];
const plannerTimeouts: number[] = [];
const plannerGates = new Map<string, Promise<void>>();
const credentialCompletionGates = new Map<string, Promise<void>>();
const credentialSearchAttempts = new Map<string, number>();
const credentialSearchSettledAttempts = new Map<string, number>();
const credentialSearchOptions: Array<{
    topic: string;
    expandQueries?: boolean;
    preferStoredText?: boolean;
    deadlineAt?: number;
    calledAt: number;
}> = [];
let titleProvider = 'openai';
let normalCredentialState: {
    status?: 'pending' | 'ready' | 'empty' | 'error';
    title: string;
} = { title: 'Legacy' };
let normalCredentials: Array<{
    uri: string;
    context: string;
    score: number;
}> = [];
let claimLegacySearch = false;
let publicationShouldFail = false;
let eraseDuringBoostCreation = false;
const publicationLedger = new Map<string, ExternalArtifact>();
const contractWrites: string[] = [];
const readableIssuedCredentials = new Map<string, VC>();
let ingestionPending = false;
const ingestionWaitTimeouts: number[] = [];
const waitForCredentialIngestion = mock(async (_did: string, timeoutMs: number) => {
    ingestionWaitTimeouts.push(timeoutMs);
    ingestionPending = false;

    return { phase: 'ready' as const };
});
let nextThread = 1;
let replacedThreadIds: string[] = [];
let erasureRequested = false;
let activeOwnerOperations = 0;
const ownerSockets = new Set<unknown>();

class TestDataErasureRequestedError extends Error {
    readonly code = 'data_erasure_requested';
}

const beginTestOwnerOperation = async () => {
    if (erasureRequested) throw new TestDataErasureRequestedError();

    activeOwnerOperations += 1;
    let released = false;

    return async () => {
        if (released) return;

        released = true;
        activeOwnerOperations -= 1;
    };
};

const db = {
    getExternalArtifacts: async () => [...publicationLedger.values()],
    reserveExternalArtifact: async (
        _did: string,
        entry: Pick<ExternalArtifact, 'operationId' | 'kind' | 'credentialId'>
    ) => {
        if (erasureRequested) throw new TestDataErasureRequestedError();
        publicationLedger.set(entry.operationId, {
            ...entry,
            subjectRef: 'test-owner',
            status: 'reserved',
            uris: [],
            reservedAt: new Date().toISOString(),
        });
    },
    completeExternalArtifact: async (
        _did: string,
        operationId: string,
        result: Pick<ExternalArtifact, 'uris' | 'status'>
    ) => {
        const entry = publicationLedger.get(operationId);
        if (!entry) throw new Error('Missing reservation');
        Object.assign(entry, result);
    },
    createThread: mock(async () => 'thread-generic'),
    hasThread: mock(async () => true),
    ownsBoost: mock(async () => true),
    setThreadCredentialContextState: mock(
        async (_threadId: string, _did: string, status: string) => {
            operations.push(`credential:${status}`);
        }
    ),
    storeThreadCredentials: mock(
        async (_did: string, _threadId: string, credentials: unknown[]) => {
            operations.push(`credentials:${credentials.length}`);
        }
    ),
    storeThreadPlan: mock(async () => {
        operations.push('plan:stored');
    }),
    startThreadPlan: mock(async () => true),
    resetThreadPlanStarted: mock(async () => undefined),
    updateThreadTitle: mock(async () => undefined),
    addMessage: mock(async () => undefined),
    updateThreadTopicCredentialUri: mock(async () => undefined),
    isThreadEnded: mock(async () => false),
    getThreadMode: mock(async () => 'ai-tutor'),
    getThreadSummaryCredentials: mock(async () => []),
    getThreadTopicCredential: mock(async () => undefined),
    getModelMessages: mock(async () => []),
    getThreadPlans: mock(async (): Promise<Array<{ plan_data: string; created_at: string }>> => []),
    getThreadCredentials: mock(async () => normalCredentials),
    getThreadCredentialContextState: mock(async () => normalCredentialState),
    claimThreadCredentialContextSearch: mock(async () => {
        if (!claimLegacySearch) return false;

        claimLegacySearch = false;
        normalCredentialState = { ...normalCredentialState, status: 'pending' };

        return true;
    }),
};

const aiCall = mock(async ({ model, signal }: { model: string; signal?: AbortSignal }) => {
    signal?.throwIfAborted();

    return model === 'title' ? 'Normal Title' : plan;
});
const streamingAiCall = mock(
    async ({
        message,
        options,
    }: {
        message: unknown;
        options?: {
            onChunk?: (chunk: string) => void;
            signal?: AbortSignal;
            timeoutMs?: number;
        };
    }) => {
        if (
            Array.isArray(message) &&
            message.some(
                item =>
                    item &&
                    typeof item === 'object' &&
                    'content' in item &&
                    item.content === 'FAIL_RESPONSE'
            )
        ) {
            throw new Error('response failed');
        }

        const gate = typeof message === 'string' ? plannerGates.get(message) : undefined;

        if (gate) await gate;

        options?.signal?.throwIfAborted();
        options?.onChunk?.('Formatted plan');

        return 'Formatted plan';
    }
);
const streamingStructuredAiCall = mock(
    async ({
        message,
        signal,
        timeoutMs,
        onPartial,
    }: {
        message: string;
        signal: AbortSignal;
        timeoutMs: number;
        onPartial: (partial: typeof plan) => void;
    }) => {
        plannerTimeouts.push(timeoutMs);

        if (message === 'Quota') {
            throw new AiProviderError({
                code: 'ai_provider_quota_exhausted',
                provider: 'openai',
                retryable: false,
                httpStatus: 503,
            });
        }

        if (message === 'Timeout') {
            const { promise, reject } = Promise.withResolvers<void>();
            signal.addEventListener('abort', () => reject(signal.reason), {
                once: true,
            });
            await promise;
        }

        const gate = plannerGates.get(message);

        if (gate) await gate;

        signal.throwIfAborted();
        onPartial(plan);

        return plan;
    }
);
const credentialContext = {
    uri: 'lc:credential:1',
    context: 'Relevant credential',
    score: 0.9,
};

const waitForAbort = async (signal: AbortSignal): Promise<never> => {
    signal.throwIfAborted();
    const { promise, reject } = Promise.withResolvers<never>();

    signal.addEventListener('abort', () => reject(signal.reason), { once: true });

    return promise;
};

const searchCredentialContextsByTopic = mock(
    async (
        topic: string,
        _did: string,
        options: {
            signal?: AbortSignal;
            expandQueries?: boolean;
            preferStoredText?: boolean;
            deadlineAt?: number;
            onMetrics?: (metrics: {
                embeddingTextsFromCache: boolean;
                resultCount: number;
            }) => void;
        }
    ) => {
        const attempt = (credentialSearchAttempts.get(topic) ?? 0) + 1;
        credentialSearchAttempts.set(topic, attempt);
        credentialSearchOptions.push({
            topic,
            expandQueries: options.expandQueries,
            preferStoredText: options.preferStoredText,
            deadlineAt: options.deadlineAt,
            calledAt: performance.now(),
        });

        try {
            if (topic === 'Delayed') await Bun.sleep(100);

            // The production shape: signed calls 401 and retry, so the rejection
            // lands after the context deadline has already fired.
            if ((topic === 'Unauthorized' || topic === 'VerificationUnavailable') && attempt === 1)
                await waitForAbort(options.signal!).catch(() => undefined);
            if (topic === 'VerificationUnavailable')
                throw new CredentialVerificationUnavailableError('sdk_timeout');
            // Prod shape for the incident: verify returned an unlisted error string.
            if (topic === 'BoostUnrecognized')
                throw new CredentialVerificationUnavailableError(
                    'unrecognized_verifier_error',
                    'boost_authenticity_exception'
                );
            // A confirmed-invalid credential: logged with its own code, not unknown.
            if (topic === 'InvalidCredential')
                throw markCredentialItemFailure(
                    new Error('synthetic-private-payload'),
                    'credential_invalid'
                );
            if (topic === 'Unauthorized')
                throw TRPCClientError.from({
                    error: {
                        message: 'synthetic-private-payload',
                        code: -32001,
                        data: { code: 'UNAUTHORIZED', httpStatus: 401, path: 'synthetic' },
                    },
                });

            // Prod shape for 8027ms/unknown: the circuit rewrapped the deadline.
            if (topic === 'WrappedDeadline' && attempt === 1) {
                await waitForAbort(options.signal!).catch(() => undefined);
                throw Object.assign(new Error('synthetic provider timeout'), {
                    name: 'AiProviderError',
                    code: 'ai_request_timeout',
                    provider: 'bedrock-embeddings',
                });
            }

            if (
                attempt === 1 &&
                [
                    'CredentialTimeout',
                    'Deferred',
                    'GoogleDeferred',
                    'DeferredTimeout',
                    'DeferredAbort',
                    'DeferredAllInvalid',
                    'DeferredClosed',
                ].includes(topic)
            ) {
                await waitForAbort(options.signal!);
            }

            if (attempt > 1 && topic === 'DeferredTimeout') throw new LearnCardTimeoutError();
            if (attempt > 1 && topic === 'DeferredAbort')
                throw new DOMException('synthetic abort', 'AbortError');

            const completionGate = credentialCompletionGates.get(topic);

            if (attempt > 1 && completionGate) await completionGate;

            options.signal?.throwIfAborted();

            const contexts =
                topic === 'Ready' ||
                ((topic === 'GoogleDeferred' || topic === 'DeferredClosed') && attempt > 1)
                    ? [credentialContext]
                    : [];

            options.onMetrics?.({
                embeddingTextsFromCache: false,
                resultCount: contexts.length,
            });

            return contexts;
        } finally {
            credentialSearchSettledAttempts.set(topic, attempt);
        }
    }
);
const enrichCredentialTitles = mock(async (contexts: unknown[]) => contexts);
const searchCredentialsByTopic = mock(
    async (_topic: string, _did: string, _options: { limit: number }) => []
);
const createActiveSessionThread = mock(
    async (
        _did: string,
        title: string,
        _isCurrent: () => boolean,
        onThreadsEnded?: (threadIds: string[]) => void,
        _mode?: 'ai-tutor' | 'ai-insights'
    ) => {
        onThreadsEnded?.(replacedThreadIds);

        if (title === 'New Topic') return 'thread-generic';

        const threadId = `thread-${nextThread}`;
        nextThread += 1;

        return threadId;
    }
);
const timingFrames: Array<{
    operation: string;
    metadata?: Record<string, unknown>;
}> = [];
const createRequestTiming = mock(() => ({
    mark: (operation: string, metadata?: Record<string, unknown>) => {
        timingFrames.push({ operation, metadata });
    },
    markFirstDelta: (metadata?: Record<string, unknown>) => {
        if (timingFrames.some(frame => frame.operation === 'plan.first_delta')) return;
        timingFrames.push({ operation: 'plan.first_delta', metadata });
    },
}));
const getLearnCard = mock(async () => ({
    id: { did: () => 'did:example:issuer' },
    read: { get: async (uri: string) => readableIssuedCredentials.get(uri) },
    invoke: {
        getBoost: async () => ({ name: 'AI Passport credential', boost: {} }),
        createBoost: async () => {
            if (
                ![...publicationLedger.values()].some(
                    entry => entry.kind === 'boost' && entry.status === 'reserved'
                )
            )
                throw new Error('Untracked boost publication');
            if (publicationShouldFail) throw new Error('publication failed');
            if (eraseDuringBoostCreation) erasureRequested = true;
            return 'lc:topic:1';
        },
        issueCredential: async (credential: UnsignedVC) => ({
            ...credential,
            proof: {
                type: 'Ed25519Signature2020',
                created: '2026-01-01T00:00:00Z',
                proofPurpose: 'assertionMethod',
                verificationMethod: 'did:example:issuer#key-1',
                proofValue: 'synthetic-proof',
            },
        }),
        createDagJwe: async (credential: VC) => {
            readableIssuedCredentials.set('lc:credential:1', credential);
            return {
                protected: 'protected',
                iv: 'iv',
                ciphertext: 'opaque',
                tag: 'tag',
            };
        },
        writeCredentialToContract: async () => {
            if (
                ![...publicationLedger.values()].some(
                    entry => entry.kind === 'contract-credential' && entry.status === 'reserved'
                )
            )
                throw new Error('Untracked contract publication');
            contractWrites.push('lc:credential:1');
            return 'lc:credential:1';
        },
    },
}));
const getSuggestedTopics = mock(async () => ({
    topics: [] as string[],
    count: 0,
}));

mock.module('../ai', () => ({
    aiCall,
    streamingAiCall,
    streamingStructuredAiCall,
}));
mock.module('../ai/providers', () => ({
    detectProvider: (model: string) => (model === 'title' ? titleProvider : 'openai'),
    parseOpenAIModelAlias: (model: string) => ({ apiModel: model }),
}));
mock.module('../ai/provider-circuit', () => ({
    withAiProviderCircuit: async <T>(_provider: string, operation: () => Promise<T>) => operation(),
}));
mock.module('../services/awarding', () => ({
    createTopicVCStructure: (_issuer: string, did: string, topic: string) => ({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: 'did:example:issuer',
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: { id: did },
        topicInfo: { title: topic },
    }),
    sendConversationSummary: mock(async () => undefined),
}));
mock.module('../credentials/service', () => ({
    getSuggestedTopics,
    fetchCredentials: mock(async () => []),
    startCredentialIngestionJob: mock(async () => undefined),
    startPeriodicRefresh: mock(() => undefined),
    stopPeriodicRefresh: mock(() => undefined),
    warmUpTopicsCache: mock(async () => undefined),
}));
mock.module('../db', () => ({ db }));
mock.module('../learncard', () => ({ getLearnCard }));
mock.module('../learncard/constants', () => ({ contractUri: 'contract:test' }));
const warmCredentialTopicExpansion = mock(
    async (_topic: string, _did: string, _options: { signal?: AbortSignal }) => undefined
);
mock.module('../services/credentialSearch', () => ({
    enrichCredentialTitles,
    searchCredentialContextsByTopic,
    searchCredentialsByTopic,
    warmCredentialTopicExpansion,
}));
mock.module('../services/sessionLifecycle', () => ({
    createActiveSessionThread,
}));
mock.module('../workers/credentialIngestionState', () => ({
    getCredentialIngestionState: () =>
        ingestionPending ? { phase: 'active' } : { phase: 'ready' },
    isCredentialIngestionPending: () => ingestionPending,
    waitForCredentialIngestion,
    refreshCredentialIngestionState: mock(async () =>
        ingestionPending ? { phase: 'active' } : { phase: 'ready' }
    ),
}));
mock.module('../workers/subscriptions', () => ({
    unsubscribeWebSocketFromAllJobs: mock(() => undefined),
}));
mock.module('../services/insightSessions', () => ({
    getInsightsPrompt: () => '',
    maybeGenerateArtifact: mock(async () => undefined),
}));
mock.module('../services/dataErasure', () => ({
    assertOwnerOperationActive: async () => {
        if (erasureRequested) throw new TestDataErasureRequestedError();
    },
    withOwnerOperation: mock(
        async (_did: string, operation: (signal: AbortSignal) => Promise<unknown>) => {
            const finish = await beginTestOwnerOperation();
            try {
                const result = await operation(new AbortController().signal);
                if (erasureRequested) throw new TestDataErasureRequestedError();
                return result;
            } finally {
                await finish();
            }
        }
    ),
    isDataErasureRequestedError: (error: unknown) => error instanceof TestDataErasureRequestedError,
    registerOwnerSocket: (_did: string, socket: unknown) => ownerSockets.add(socket),
    unregisterOwnerSocket: (_did: string, socket: unknown) => ownerSockets.delete(socket),
}));
mock.module('../utils/timing', () => ({
    createRequestTiming,
    sendTimingEvent: mock(() => undefined),
    timeOperation: async (_ws: unknown, _operation: string, operation: () => Promise<unknown>) =>
        operation(),
}));
mock.module('../constants/env', () => ({
    CHAT_MODEL: 'chat',
    FORMATTING_MODEL: 'format',
    PLANNING_MODEL: 'plan',
    SESSION_CONTEXT_BUDGET_MS: 150,
    SESSION_FIRST_MODULE_CONTEXT_WAIT_MS: 20,
    CREDENTIAL_INGESTION_STARTUP_WAIT_MS: 30,
    SESSION_PLAN_TIMEOUT_MS: 1_000,
    TITLE_MODEL: 'title',
}));

// Bun must install all dependency doubles before the WebSocket module initializes.
const { activeStartups, getThreadClient, getThreadClients, threadClients, websocketHandler } =
    await import('./index');

class TestSocket {
    readonly data: { did: string; threadId?: string };
    readonly sent: unknown[] = [];
    readyState: number = WebSocket.OPEN;

    constructor(did: string, threadId?: string) {
        this.data = { did, threadId };
    }

    send(payload: string) {
        const parsed = JSON.parse(payload);
        this.sent.push(parsed);
        operations.push(
            parsed && typeof parsed === 'object' && 'event' in parsed
                ? `send:${String(parsed.event)}`
                : 'send:chunk'
        );
    }

    close() {
        this.readyState = WebSocket.CLOSED;
    }
}

const asSocket = (socket: TestSocket) =>
    socket as unknown as ServerWebSocket<{
        did: string;
        type?: string;
        threadId?: string;
    }>;
const events = (socket: TestSocket, event: string) =>
    socket.sent.filter(
        frame => frame && typeof frame === 'object' && 'event' in frame && frame.event === event
    );

const start = (
    socket: TestSocket,
    topic: string,
    introStreamMode: 'structured' | 'formatted' = 'structured'
) =>
    websocketHandler.message(
        asSocket(socket),
        JSON.stringify({ action: 'start_topic', topic, introStreamMode })
    );

const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const waitFor = async (condition: () => boolean, label: string): Promise<void> => {
    const deadline = performance.now() + 500;

    while (!condition()) {
        if (performance.now() >= deadline) {
            throw new Error(`Timed out waiting for ${label}`);
        }

        await Bun.sleep(1);
    }
};

describe('WebSocket session startup', () => {
    beforeEach(() => {
        activeStartups.clear();
        websocketHandler.clients.clear();
        threadClients.clear();
        operations.length = 0;
        plannerTimeouts.length = 0;
        plannerGates.clear();
        credentialCompletionGates.clear();
        credentialSearchAttempts.clear();
        credentialSearchSettledAttempts.clear();
        credentialSearchOptions.length = 0;
        timingFrames.length = 0;
        titleProvider = 'openai';
        normalCredentialState = { title: 'Legacy' };
        normalCredentials = [];
        claimLegacySearch = false;
        publicationShouldFail = false;
        eraseDuringBoostCreation = false;
        publicationLedger.clear();
        contractWrites.length = 0;
        readableIssuedCredentials.clear();
        db.updateThreadTopicCredentialUri.mockClear();
        erasureRequested = false;
        activeOwnerOperations = 0;
        ownerSockets.clear();
        getSuggestedTopics.mockReset();
        getSuggestedTopics.mockResolvedValue({ topics: [], count: 0 });
        nextThread = 1;
        replacedThreadIds = [];
        ingestionPending = false;
        waitForCredentialIngestion.mockClear();
        ingestionWaitTimeouts.length = 0;
        db.setThreadCredentialContextState.mockClear();
        db.storeThreadCredentials.mockClear();
        db.storeThreadPlan.mockClear();
        db.addMessage.mockReset();
        db.addMessage.mockResolvedValue(undefined);
        db.updateThreadTitle.mockClear();
        db.startThreadPlan.mockClear();
        db.startThreadPlan.mockImplementation(async () => true);
        db.resetThreadPlanStarted.mockClear();
        db.getThreadPlans.mockClear();
        createActiveSessionThread.mockClear();
        streamingStructuredAiCall.mockClear();
        aiCall.mockClear();
        streamingAiCall.mockClear();
        searchCredentialContextsByTopic.mockClear();
        enrichCredentialTitles.mockClear();
        searchCredentialsByTopic.mockClear();
        warmCredentialTopicExpansion.mockClear();
        db.claimThreadCredentialContextSearch.mockClear();
    });

    afterEach(() => activeStartups.clear());
    it.each([
        {
            error: new CredentialVerificationUnavailableError(),
            code: 'credential_verification_unavailable',
        },
        {
            error: new Error('Private credential failure: private@example.test'),
            code: 'credential_preload_unavailable',
        },
        {
            error: new AiProviderError({
                code: 'ai_provider_unavailable',
                provider: 'bedrock',
                retryable: false,
                httpStatus: 503,
            }),
            code: 'credential_preload_unavailable',
        },
    ])('keeps planning alive after optional preload failure ($code)', async ({ error, code }) => {
        publicationShouldFail = true;
        const preload = Promise.withResolvers<{
            topics: string[];
            count: number;
        }>();
        const planner = Promise.withResolvers<void>();
        getSuggestedTopics.mockImplementationOnce(() => preload.promise);
        plannerGates.set('Preload failure', planner.promise);
        const socket = new TestSocket('did:example:learner');
        const opening = websocketHandler.open(asSocket(socket));
        await waitFor(() => ownerSockets.has(asSocket(socket)), 'socket registration');
        const startup = start(socket, 'Preload failure');
        await waitFor(() => streamingStructuredAiCall.mock.calls.length === 1, 'planner');

        preload.reject(error);
        await opening;
        const stillOpen = socket.readyState === WebSocket.OPEN;
        planner.resolve();
        await startup;
        await settle();

        expect(stillOpen).toBe(true);
        expect(events(socket, 'credential_preload_error')).toEqual([
            { event: 'credential_preload_error', code },
        ]);
        expect(events(socket, 'plan_ready')).toHaveLength(1);
        expect(events(socket, 'session_start_error')).toHaveLength(0);
        expect(JSON.stringify(socket.sent)).not.toContain('private@example.test');
    });

    it('still closes sockets denied owner admission', async () => {
        erasureRequested = true;
        const socket = new TestSocket('did:example:learner');
        await websocketHandler.open(asSocket(socket));

        expect(socket.readyState).toBe(WebSocket.CLOSED);
        expect(events(socket, 'credential_preload_error')).toHaveLength(0);
        expect(ownerSockets.has(asSocket(socket))).toBe(false);
    });

    it('does not downgrade owner erasure during preload to a warning', async () => {
        const preload = Promise.withResolvers<{
            topics: string[];
            count: number;
        }>();
        getSuggestedTopics.mockImplementationOnce(() => preload.promise);
        const socket = new TestSocket('did:example:learner');
        const opening = websocketHandler.open(asSocket(socket));
        await waitFor(() => ownerSockets.has(asSocket(socket)), 'socket registration');
        erasureRequested = true;
        preload.reject(new TestDataErasureRequestedError());
        await opening;

        expect(socket.readyState).toBe(WebSocket.CLOSED);
        expect(events(socket, 'credential_preload_error')).toHaveLength(0);
    });

    it('does not deliver a late preload warning to a replacement socket', async () => {
        const preload = Promise.withResolvers<{
            topics: string[];
            count: number;
        }>();
        getSuggestedTopics.mockImplementationOnce(() => preload.promise);
        const first = new TestSocket('did:example:learner');
        const second = new TestSocket('did:example:learner');
        const opening = websocketHandler.open(asSocket(first));
        await waitFor(() => ownerSockets.has(asSocket(first)), 'first registration');
        await websocketHandler.open(asSocket(second));
        preload.reject(new CredentialVerificationUnavailableError());
        await opening;

        expect(events(first, 'credential_preload_error')).toHaveLength(0);
        expect(events(second, 'credential_preload_error')).toHaveLength(0);
        expect(events(second, 'credentials_ready')).toHaveLength(1);
        expect(second.readyState).toBe(WebSocket.OPEN);
    });

    it('persists empty credential state and the plan before readiness', async () => {
        publicationShouldFail = true;
        const socket = new TestSocket('did:example:learner');

        await start(socket, 'Fast');
        await settle();

        expect(db.setThreadCredentialContextState).toHaveBeenCalledWith(
            'thread-1',
            'did:example:learner',
            'pending',
            'Fast'
        );
        expect(db.storeThreadCredentials).toHaveBeenCalledWith(
            'did:example:learner',
            'thread-1',
            []
        );
        expect(operations.indexOf('plan:stored')).toBeLessThan(
            operations.indexOf('send:plan_ready')
        );
        expect(events(socket, 'plan_ready')).toHaveLength(1);
        expect(events(socket, 'session_start_error')).toHaveLength(0);
        expect(plannerTimeouts[0]).toBeGreaterThan(0);
        expect(plannerTimeouts[0]).toBeLessThanOrEqual(1_000);
    });

    // The live AI E2E user has no profile on the LearnCard network, so the
    // consent lookup fails with tRPC NOT_FOUND before any provider call.
    const missingLearnCardProfile = () =>
        TRPCClientError.from({
            error: {
                message: 'synthetic-private-payload',
                code: -32004,
                data: {
                    code: 'NOT_FOUND',
                    httpStatus: 404,
                    path: 'contracts.getConsentedDataForDid',
                },
            },
        });

    it('classifies a missing LearnCard profile during session start', async () => {
        const output: unknown[][] = [];
        const originalError = console.error;
        console.error = mock((...data: unknown[]) => output.push(data));
        const restoreLogging = configureProductionLogging('production');
        try {
            streamingStructuredAiCall.mockImplementationOnce(async () => {
                throw missingLearnCardProfile();
            });
            const socket = new TestSocket('did:example:private-synthetic-learner');
            await start(socket, 'Fractions');

            expect(output.flat()).toContainEqual({
                event: 'ai_session_start_failed',
                failureCode: 'learncard_subject_not_found',
                learncardErrorClass: 'TRPCClientError',
                trpcCode: 'NOT_FOUND',
                httpStatus: 404,
            });
            expect(JSON.stringify(output)).not.toContain('synthetic-private-payload');
            expect(JSON.stringify(output)).not.toContain(socket.data.did);
            expect(events(socket, 'session_start_error')).toEqual([
                expect.objectContaining({ code: 'start_failed' }),
            ]);
        } finally {
            restoreLogging();
            console.error = originalError;
        }
    });

    // The v190 Math white-screen: the shared init failed with a bare string
    // (class unknown). Name what it was on every event that reports it.
    const learnCardBlip = () =>
        new LearnCardUnavailableError({
            errorClass: 'unknown',
            causeKind: 'other',
            initAttempts: 2,
        });

    it('a LearnCard outage in the opening consent read still reaches the plan', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            searchCredentialContextsByTopic.mockImplementationOnce(async () => {
                throw learnCardBlip();
            });
            const socket = new TestSocket('did:example:opening-learncard-blip');
            await start(socket, 'Math');

            expect(events(socket, 'session_start_error')).toHaveLength(0);
            expect(events(socket, 'plan_ready')).toHaveLength(1);
            expect(output).toContainEqual({
                event: 'credential_context_failed',
                failureCode: 'learncard_unavailable',
                contextPhase: 'opening',
                durationMs: expect.any(Number),
                candidateCount: 0,
                learncardErrorClass: 'unknown',
                causeKind: 'other',
                initAttempts: 2,
            });
        } finally {
            console.warn = originalWarn;
        }
    });

    it("logs the LearnCard cause when the plan's consent gate still cannot reach LearnCard", async () => {
        const output: unknown[][] = [];
        const originalError = console.error;
        console.error = mock((...data: unknown[]) => output.push(data));
        const restoreLogging = configureProductionLogging('production');
        try {
            streamingStructuredAiCall.mockImplementationOnce(async () => {
                throw learnCardBlip();
            });
            const socket = new TestSocket('did:example:plan-learncard-blip');
            await start(socket, 'Math');

            expect(output.flat()).toContainEqual({
                event: 'ai_session_start_failed',
                failureCode: 'learncard_unavailable',
                learncardErrorClass: 'unknown',
                causeKind: 'other',
                initAttempts: 2,
            });
            expect(events(socket, 'session_start_error')).toEqual([
                expect.objectContaining({ code: 'start_failed' }),
            ]);
        } finally {
            restoreLogging();
            console.error = originalError;
        }
    });

    it('classifies a missing LearnCard profile during credential preload', async () => {
        const output: unknown[][] = [];
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = mock((...data: unknown[]) => output.push(data));
        console.error = mock((...data: unknown[]) => output.push(data));
        const restoreLogging = configureProductionLogging('production');
        try {
            getSuggestedTopics.mockImplementationOnce(async () => {
                throw missingLearnCardProfile();
            });
            const socket = new TestSocket('did:example:private-synthetic-learner');
            await websocketHandler.open(asSocket(socket));

            expect(output.flat()).toContainEqual({
                event: 'credential_preload_failed',
                failureCode: 'learncard_subject_not_found',
                learncardErrorClass: 'TRPCClientError',
                trpcCode: 'NOT_FOUND',
                httpStatus: 404,
            });
            expect(JSON.stringify(output)).not.toContain('synthetic-private-payload');
            expect(events(socket, 'credential_preload_error')).toEqual([
                expect.objectContaining({ code: 'credential_preload_unavailable' }),
            ]);
        } finally {
            restoreLogging();
            console.warn = originalWarn;
            console.error = originalError;
        }
    });

    it('logs the verifier error kind when credential preload verification is unrecognized', async () => {
        const output: unknown[][] = [];
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = mock((...data: unknown[]) => output.push(data));
        console.error = mock((...data: unknown[]) => output.push(data));
        const restoreLogging = configureProductionLogging('production');
        try {
            getSuggestedTopics.mockImplementationOnce(async () => {
                throw new CredentialVerificationUnavailableError(
                    'unrecognized_verifier_error',
                    'boost_authenticity_exception'
                );
            });
            const socket = new TestSocket('did:example:private-synthetic-learner');
            await websocketHandler.open(asSocket(socket));

            expect(output.flat()).toContainEqual(
                expect.objectContaining({
                    event: 'credential_preload_failed',
                    failureCode: 'credential_verification_unavailable',
                    verificationSubreason: 'unrecognized_verifier_error',
                    verifierErrorKind: 'boost_authenticity_exception',
                })
            );
            expect(JSON.stringify(output)).not.toContain('did:example:private-synthetic-learner');
        } finally {
            restoreLogging();
            console.warn = originalWarn;
            console.error = originalError;
        }
    });

    it('logs the verification subreason when credential preload verification is unavailable', async () => {
        const output: unknown[][] = [];
        const originalWarn = console.warn;
        const originalError = console.error;
        console.warn = mock((...data: unknown[]) => output.push(data));
        console.error = mock((...data: unknown[]) => output.push(data));
        const restoreLogging = configureProductionLogging('production');
        try {
            getSuggestedTopics.mockImplementationOnce(async () => {
                throw new CredentialVerificationUnavailableError('sdk_timeout');
            });
            const socket = new TestSocket('did:example:private-synthetic-learner');
            await websocketHandler.open(asSocket(socket));

            expect(output.flat()).toContainEqual(
                expect.objectContaining({
                    event: 'credential_preload_failed',
                    failureCode: 'credential_verification_unavailable',
                    verificationSubreason: 'sdk_timeout',
                })
            );
            expect(JSON.stringify(output)).not.toContain('did:example:private-synthetic-learner');
            expect(events(socket, 'credential_preload_error')).toEqual([
                expect.objectContaining({
                    code: 'credential_verification_unavailable',
                }),
            ]);
        } finally {
            restoreLogging();
            console.warn = originalWarn;
            console.error = originalError;
        }
    });

    it('returns a client-safe typed error when provider quota is exhausted', async () => {
        const socket = new TestSocket('did:example:learner');

        await start(socket, 'Quota');

        expect(events(socket, 'ai_error')).toEqual([
            expect.objectContaining({
                code: 'ai_provider_quota_exhausted',
                retryable: false,
                operation: 'session_start',
                requestId: expect.any(String),
            }),
        ]);
        expect(events(socket, 'session_start_error')).toHaveLength(0);
        expect(JSON.stringify(socket.sent)).not.toContain('insufficient_quota');
    });

    it.each([
        [
            new OpenAI.BadRequestError(
                400,
                { message: 'synthetic-private-payload' },
                undefined,
                new Headers()
            ),
            'provider_request_rejected',
            400,
            'openai',
        ],
        [
            new OpenAI.AuthenticationError(
                401,
                { message: 'synthetic-private-payload' },
                undefined,
                new Headers()
            ),
            'provider_access_denied',
            401,
            'openai',
        ],
        [
            new OpenAI.NotFoundError(
                404,
                { message: 'synthetic-private-payload' },
                undefined,
                new Headers()
            ),
            'provider_resource_not_found',
            404,
            'openai',
        ],
        [
            new OpenAI.APIConnectionTimeoutError({
                message: 'synthetic-private-payload',
            }),
            'request_timeout',
            500,
            'openai',
        ],
        [
            new ValidationException({
                message: 'synthetic-private-payload',
                $metadata: { httpStatusCode: 400 },
            }),
            'provider_request_rejected',
            400,
            'bedrock',
        ],
    ] as const)(
        'classifies real SDK failures under production redaction (%#)',
        async (cause, failureCode, httpStatus, provider) => {
            const output: unknown[][] = [];
            const originalError = console.error;
            console.error = mock((...data: unknown[]) => output.push(data));
            const restoreLogging = configureProductionLogging('production');
            try {
                streamingStructuredAiCall.mockImplementationOnce(async () => {
                    throw new AiProviderError({
                        code: 'ai_unknown_error',
                        provider,
                        retryable: false,
                        httpStatus: 500,
                        cause,
                    });
                });
                const socket = new TestSocket('did:example:private-synthetic-learner');
                await start(socket, 'Fractions');

                expect(output.flat()).toContainEqual({
                    event: 'ai_session_start_failed',
                    provider,
                    failureCode,
                    httpStatus,
                });
                expect(JSON.stringify(output)).not.toContain('synthetic-private-payload');
                expect(JSON.stringify(output)).not.toContain(socket.data.did);
                expect(events(socket, 'ai_error')).toEqual([
                    expect.objectContaining({
                        code: 'ai_unknown_error',
                        operation: 'session_start',
                    }),
                ]);
            } finally {
                restoreLogging();
                console.error = originalError;
            }
        }
    );

    it('routes same-DID sockets independently by thread', async () => {
        const did = 'did:example:learner';
        const firstSocket = new TestSocket(did, 'thread-first');
        const secondSocket = new TestSocket(did, 'thread-second');

        await websocketHandler.open(asSocket(firstSocket));
        await websocketHandler.open(asSocket(secondSocket));

        expect(getThreadClient(did, 'thread-first')).toBe(asSocket(firstSocket));
        expect(getThreadClient(did, 'thread-second')).toBe(asSocket(secondSocket));

        await websocketHandler.close(asSocket(firstSocket));

        expect(getThreadClient(did, 'thread-first')).toBeUndefined();
        expect(getThreadClient(did, 'thread-second')).toBe(asSocket(secondSocket));
    });

    it('retains every socket subscribed to the same thread', async () => {
        const did = 'did:example:learner';
        const firstSocket = new TestSocket(did, 'thread-shared');
        const secondSocket = new TestSocket(did, 'thread-shared');

        await websocketHandler.open(asSocket(firstSocket));
        await websocketHandler.open(asSocket(secondSocket));

        expect(getThreadClients(did, 'thread-shared')).toEqual([
            asSocket(firstSocket),
            asSocket(secondSocket),
        ]);

        await websocketHandler.close(asSocket(secondSocket));

        expect(getThreadClients(did, 'thread-shared')).toEqual([asSocket(firstSocket)]);
        expect(websocketHandler.clients.get(did)).toBe(asSocket(firstSocket));
    });

    it('notifies another tab when their shared thread changes', async () => {
        const did = 'did:example:learner';
        const firstSocket = new TestSocket(did, 'thread-shared');
        const secondSocket = new TestSocket(did, 'thread-shared');

        await websocketHandler.open(asSocket(firstSocket));
        await websocketHandler.open(asSocket(secondSocket));
        await websocketHandler.message(
            asSocket(firstSocket),
            JSON.stringify({
                threadId: 'thread-shared',
                message: { role: 'user', content: 'Shared question' },
            })
        );

        expect(events(secondSocket, 'thread_updated')).toEqual([
            {
                event: 'thread_updated',
                threadId: 'thread-shared',
                phase: 'responding',
            },
            {
                event: 'thread_updated',
                threadId: 'thread-shared',
                phase: 'ready',
            },
        ]);
        expect(events(firstSocket, 'thread_updated')).toHaveLength(0);
    });

    it('keeps the owner operation active through the final message write', async () => {
        const did = 'did:example:learner';
        const socket = new TestSocket(did, 'thread-shared');
        let releaseWrite: (() => void) | undefined;
        let messageWrites = 0;

        db.addMessage.mockImplementation(async () => {
            messageWrites += 1;
            if (messageWrites < 2) return;

            await new Promise<void>(resolve => {
                releaseWrite = resolve;
            });
        });

        const interaction = websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-shared',
                message: { role: 'user', content: 'Shared question' },
            })
        );

        await waitFor(() => messageWrites === 2, 'final message persistence');

        expect(activeOwnerOperations).toBe(1);

        releaseWrite?.();
        await interaction;
        await waitFor(() => activeOwnerOperations === 0, 'owner operation release');

        expect(activeOwnerOperations).toBe(0);
    });

    it('rejects and closes messages after erasure is requested', async () => {
        const socket = new TestSocket('did:example:learner', 'thread-shared');
        erasureRequested = true;

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-shared',
                message: { role: 'user', content: 'Too late' },
            })
        );

        expect(socket.readyState).toBe(WebSocket.CLOSED);
        expect(socket.sent).toContainEqual({ error: 'data_erasure_requested' });
        expect(db.addMessage).not.toHaveBeenCalled();
    });

    it('sends a terminal sync phase and releases the lock after failure', async () => {
        const did = 'did:example:learner';
        const firstSocket = new TestSocket(did, 'thread-shared');
        const secondSocket = new TestSocket(did, 'thread-shared');

        await websocketHandler.open(asSocket(firstSocket));
        await websocketHandler.open(asSocket(secondSocket));
        await websocketHandler.message(
            asSocket(firstSocket),
            JSON.stringify({
                threadId: 'thread-shared',
                message: { role: 'user', content: 'FAIL_RESPONSE' },
            })
        );

        expect(events(secondSocket, 'thread_updated')).toEqual([
            {
                event: 'thread_updated',
                threadId: 'thread-shared',
                phase: 'responding',
            },
            {
                event: 'thread_updated',
                threadId: 'thread-shared',
                phase: 'error',
            },
        ]);

        await websocketHandler.message(
            asSocket(firstSocket),
            JSON.stringify({
                threadId: 'thread-shared',
                message: { role: 'user', content: 'Retry' },
            })
        );

        expect(events(secondSocket, 'thread_updated').at(-1)).toEqual({
            event: 'thread_updated',
            threadId: 'thread-shared',
            phase: 'ready',
        });
    });

    it('notifies the previous tab when another tab replaces its session', async () => {
        const did = 'did:example:learner';
        const previousSocket = new TestSocket(did, 'thread-previous');
        const replacementSocket = new TestSocket(did);
        replacedThreadIds = ['thread-previous'];

        await websocketHandler.open(asSocket(previousSocket));
        await start(replacementSocket, 'Replacement');

        expect(events(previousSocket, 'session_replaced')).toEqual([
            { event: 'session_replaced', threadId: 'thread-previous' },
        ]);
        expect(events(replacementSocket, 'plan_ready')).toHaveLength(1);
    });

    it('does not notify the socket that initiated its own replacement', async () => {
        const did = 'did:example:learner';
        const socket = new TestSocket(did, 'thread-previous');
        replacedThreadIds = ['thread-previous'];

        await websocketHandler.open(asSocket(socket));
        await start(socket, 'Replacement');

        expect(events(socket, 'session_replaced')).toHaveLength(0);
        expect(events(socket, 'plan_ready')).toHaveLength(1);
        expect(socket.readyState).toBe(WebSocket.OPEN);
    });

    it('persists and returns one generated title for a new generic thread', async () => {
        const socket = new TestSocket('did:example:generic');

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                message: { role: 'user', content: "Okay let's go" },
            })
        );

        expect(db.updateThreadTitle).toHaveBeenCalledWith(
            'did:example:generic',
            'thread-generic',
            'Formatted plan'
        );
        expect(aiCall).not.toHaveBeenCalled();
        expect(socket.sent).toContainEqual({
            done: true,
            threadId: 'thread-generic',
            title: 'Formatted plan',
        });
        expect(getThreadClient('did:example:generic', 'thread-generic')).toBe(asSocket(socket));
    });

    it('keeps generic chat usable when topic publication fails', async () => {
        publicationShouldFail = true;
        const socket = new TestSocket('did:example:generic');

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                message: { role: 'user', content: 'Keep this session usable' },
            })
        );
        await waitFor(
            () => events(socket, 'topic_publication_status').length === 2,
            'generic publication failure status'
        );

        expect(socket.sent).toContainEqual({
            done: true,
            threadId: 'thread-generic',
            title: 'Formatted plan',
        });
        expect(events(socket, 'topic_publication_status')).toEqual([
            {
                event: 'topic_publication_status',
                threadId: 'thread-generic',
                status: 'pending',
            },
            {
                event: 'topic_publication_status',
                threadId: 'thread-generic',
                status: 'error',
            },
        ]);
    });

    for (const path of ['start_topic', 'first_message'] as const) {
        it(`${path} tracks both remote effects before reporting publication ready`, async () => {
            const socket = new TestSocket('did:example:learner');
            if (path === 'start_topic') await start(socket, 'Private topic');
            else
                await websocketHandler.message(
                    asSocket(socket),
                    JSON.stringify({
                        message: { role: 'user', content: 'Private topic' },
                    })
                );
            await waitFor(
                () =>
                    events(socket, 'topic_publication_status').some(
                        event =>
                            event !== null &&
                            typeof event === 'object' &&
                            'status' in event &&
                            event.status === 'ready'
                    ),
                'tracked publication'
            );
            expect(
                [...publicationLedger.values()].map(({ kind, status, uris }) => ({
                    kind,
                    status,
                    uris,
                }))
            ).toEqual([
                { kind: 'boost', status: 'complete', uris: ['lc:topic:1'] },
                {
                    kind: 'contract-credential',
                    status: 'complete',
                    uris: ['lc:credential:1'],
                },
            ]);
            expect(contractWrites).toEqual(['lc:credential:1']);
        });

        it(`${path} preserves a tracked orphan when erased after boost creation`, async () => {
            eraseDuringBoostCreation = true;
            const socket = new TestSocket('did:example:learner');
            if (path === 'start_topic') await start(socket, 'Private topic');
            else
                await websocketHandler.message(
                    asSocket(socket),
                    JSON.stringify({
                        message: { role: 'user', content: 'Private topic' },
                    })
                );
            await waitFor(
                () =>
                    [...publicationLedger.values()].some(entry => entry.status === 'complete') &&
                    activeOwnerOperations === 0,
                'fenced publication completion'
            );
            expect(
                [...publicationLedger.values()].map(({ kind, status, uris }) => ({
                    kind,
                    status,
                    uris,
                }))
            ).toEqual([{ kind: 'boost', status: 'complete', uris: ['lc:topic:1'] }]);
            expect(contractWrites).toEqual([]);
            expect(db.updateThreadTopicCredentialUri).not.toHaveBeenCalled();
        });
    }

    it('resumes the private issued topic rather than its generic remote template', async () => {
        const socket = new TestSocket('did:example:learner');
        await start(socket, 'Private topic');
        await waitFor(
            () => contractWrites.length === 1 && activeOwnerOperations === 0,
            'private topic publication'
        );
        socket.sent.length = 0;
        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                action: 'start_topic_uri',
                topicUri: 'lc:topic:1',
                introStreamMode: 'structured',
            })
        );
        expect(events(socket, 'plan_ready')).toMatchObject([
            { event: 'plan_ready', threadId: 'thread-2', title: 'Private topic' },
        ]);
    });

    it('supersedes the older socket and keeps newer ownership on old close', async () => {
        const did = 'did:example:learner';
        const firstSocket = new TestSocket(did);
        const secondSocket = new TestSocket(did);
        const firstGate = Promise.withResolvers<void>();
        const secondGate = Promise.withResolvers<void>();
        plannerGates.set('First', firstGate.promise);
        plannerGates.set('Second', secondGate.promise);

        const firstStart = start(firstSocket, 'First');
        await settle();
        const firstStartup = activeStartups.get(did);
        const secondStart = start(secondSocket, 'Second');
        await settle();
        const secondStartup = activeStartups.get(did);

        expect(firstStartup?.controller.signal.aborted).toBe(true);
        expect(secondStartup?.ws).toBe(asSocket(secondSocket));

        websocketHandler.clients.set(did, asSocket(secondSocket));
        await websocketHandler.close(asSocket(firstSocket));
        expect(activeStartups.get(did)).toBe(secondStartup);
        expect(websocketHandler.clients.get(did)).toBe(asSocket(secondSocket));

        firstGate.resolve();
        secondGate.resolve();
        await Promise.all([firstStart, secondStart]);
        await settle();

        expect(events(firstSocket, 'plan_structured_delta')).toHaveLength(0);
        expect(events(firstSocket, 'plan_ready')).toHaveLength(0);
        expect(events(secondSocket, 'plan_ready')).toHaveLength(1);
    });

    it('suppresses formatted chunks after supersession', async () => {
        const firstSocket = new TestSocket('did:example:learner');
        const secondSocket = new TestSocket('did:example:learner');
        const formatterGate = Promise.withResolvers<void>();
        plannerGates.set(JSON.stringify(plan), formatterGate.promise);

        const firstStart = start(firstSocket, 'Formatted', 'formatted');
        await settle();
        const secondStart = start(secondSocket, 'Current');
        await secondStart;
        formatterGate.resolve();
        await firstStart;

        expect(firstSocket.sent).not.toContain('Formatted plan');
        expect(events(firstSocket, 'plan_ready')).toHaveLength(0);
    });

    it('persists ready and timed-out credential retrieval outcomes', async () => {
        const readySocket = new TestSocket('did:example:ready');

        await start(readySocket, 'Ready');
        await waitFor(
            () => !activeStartups.has('did:example:ready'),
            'ready credential completion'
        );

        expect(db.storeThreadCredentials).toHaveBeenCalledWith('did:example:ready', 'thread-1', [
            credentialContext,
        ]);
        expect(timingFrames).toContainEqual({
            operation: 'credential_context.complete',
            metadata: expect.objectContaining({
                outcome: 'completed',
                count: 1,
                embeddingTextsFromCache: false,
            }),
        });
        expect(events(readySocket, 'credential_context_status')).toEqual([
            expect.objectContaining({ status: 'pending', count: 0 }),
            expect.objectContaining({ status: 'ready', count: 1 }),
        ]);

        const timeoutSocket = new TestSocket('did:example:credential-timeout');

        await start(timeoutSocket, 'CredentialTimeout');
        await waitFor(
            () =>
                credentialSearchSettledAttempts.get('CredentialTimeout') === 2 &&
                !activeStartups.has('did:example:credential-timeout'),
            'timed-out credential completion'
        );

        expect(credentialSearchAttempts.get('CredentialTimeout')).toBe(2);
        expect(db.storeThreadCredentials).toHaveBeenCalledWith(
            'did:example:credential-timeout',
            'thread-2',
            []
        );
        expect(timingFrames).toContainEqual({
            operation: 'credential_context.complete',
            metadata: expect.objectContaining({
                outcome: 'timeout',
                count: 0,
                embeddingTextsFromCache: false,
            }),
        });
        expect(events(timeoutSocket, 'credential_context_status')).toEqual([
            expect.objectContaining({ status: 'pending', count: 0 }),
            expect.objectContaining({ status: 'empty', count: 0 }),
        ]);
    });

    it('reports a LearnCard rejection as an error, not a timeout, and logs its cause', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const socket = new TestSocket('did:example:unauthorized');

            await start(socket, 'Unauthorized');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('Unauthorized') === 2 &&
                    !activeStartups.has('did:example:unauthorized'),
                'unauthorized credential completion'
            );

            expect(timingFrames).toContainEqual({
                operation: 'credential_context.complete',
                metadata: expect.objectContaining({ outcome: 'error', count: 0 }),
            });
            expect(timingFrames).not.toContainEqual({
                operation: 'credential_context.complete',
                metadata: expect.objectContaining({ outcome: 'timeout' }),
            });
            expect(timingFrames).toContainEqual({
                operation: 'credential_context.deferred_complete',
                metadata: expect.objectContaining({ outcome: 'error', count: 0 }),
            });
            for (const contextPhase of ['opening', 'deferred'])
                expect(output).toContainEqual({
                    event: 'credential_context_failed',
                    failureCode: 'learncard_unauthorized',
                    contextPhase,
                    durationMs: expect.any(Number),
                    candidateCount: 0,
                    learncardErrorClass: 'TRPCClientError',
                    trpcCode: 'UNAUTHORIZED',
                    httpStatus: 401,
                });
            expect(output).toContainEqual({
                event: 'credential_context_deferred_completed',
                contextOutcome: 'error',
                contextStage: 'search',
                count: 0,
                candidateCount: 0,
                durationMs: expect.any(Number),
            });
            expect(JSON.stringify(output)).not.toContain('synthetic-private-payload');
            expect(JSON.stringify(output)).not.toContain('did:example:unauthorized');
        } finally {
            console.warn = originalWarn;
        }
    });

    it('logs a fired context deadline as a timeout even when the error was rewrapped', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const socket = new TestSocket('did:example:wrapped-deadline');

            await start(socket, 'WrappedDeadline');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('WrappedDeadline') === 2 &&
                    !activeStartups.has('did:example:wrapped-deadline'),
                'wrapped-deadline credential completion'
            );

            expect(timingFrames).toContainEqual({
                operation: 'credential_context.complete',
                metadata: expect.objectContaining({ outcome: 'timeout', count: 0 }),
            });
            expect(timingFrames).not.toContainEqual({
                operation: 'credential_context.complete',
                metadata: expect.objectContaining({ outcome: 'error' }),
            });
            expect(output).toContainEqual(
                expect.objectContaining({
                    event: 'credential_context_failed',
                    failureCode: 'request_timeout',
                    contextPhase: 'opening',
                })
            );
            expect(output).not.toContainEqual(
                expect.objectContaining({
                    event: 'credential_context_failed',
                    failureCode: 'unknown',
                })
            );
        } finally {
            console.warn = originalWarn;
        }
    });

    it('logs the verification subreason when credential context verification is unavailable', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const did = 'did:example:verification-unavailable';
            const socket = new TestSocket(did);

            await start(socket, 'VerificationUnavailable');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('VerificationUnavailable') === 2 &&
                    !activeStartups.has(did),
                'verification-unavailable credential completion'
            );

            for (const contextPhase of ['opening', 'deferred'])
                expect(output).toContainEqual(
                    expect.objectContaining({
                        event: 'credential_context_failed',
                        failureCode: 'credential_verification_unavailable',
                        contextPhase,
                        verificationSubreason: 'sdk_timeout',
                    })
                );
            expect(JSON.stringify(output)).not.toContain(did);
        } finally {
            console.warn = originalWarn;
        }
    });

    it('logs the verifier error kind at both context phases and still plans', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const did = 'did:example:boost-unrecognized';
            const socket = new TestSocket(did);

            await start(socket, 'BoostUnrecognized');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('BoostUnrecognized') === 2 &&
                    !activeStartups.has(did),
                'boost-unrecognized credential completion'
            );

            for (const contextPhase of ['opening', 'deferred'])
                expect(output).toContainEqual(
                    expect.objectContaining({
                        event: 'credential_context_failed',
                        failureCode: 'credential_verification_unavailable',
                        contextPhase,
                        verificationSubreason: 'unrecognized_verifier_error',
                        verifierErrorKind: 'boost_authenticity_exception',
                    })
                );
            // The opening context degrades: the start still plans, with no error.
            expect(events(socket, 'plan_ready')).toHaveLength(1);
            expect(events(socket, 'error')).toEqual([]);
            expect(JSON.stringify(output)).not.toContain(did);
        } finally {
            console.warn = originalWarn;
        }
    });

    it('logs a marked credential failure with its own code, not unknown', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const did = 'did:example:invalid-credential';
            const socket = new TestSocket(did);

            await start(socket, 'InvalidCredential');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('InvalidCredential') === 2 &&
                    !activeStartups.has(did),
                'invalid-credential completion'
            );

            for (const contextPhase of ['opening', 'deferred'])
                expect(output).toContainEqual(
                    expect.objectContaining({
                        event: 'credential_context_failed',
                        failureCode: 'credential_invalid',
                        contextPhase,
                    })
                );
            expect(output).not.toContainEqual(expect.objectContaining({ failureCode: 'unknown' }));
            expect(JSON.stringify(output)).not.toContain('synthetic-private-payload');
            expect(JSON.stringify(output)).not.toContain(did);
        } finally {
            console.warn = originalWarn;
        }
    });

    // The search returns empty when every candidate is invalid (see
    // credentialSearch): the deferred phase reports empty, not a failure.
    it('reports a deferred context with only invalid credentials as empty', async () => {
        const output: unknown[] = [];
        const originalWarn = console.warn;
        console.warn = mock((...data: unknown[]) => output.push(...data));
        try {
            const did = 'did:example:deferredallinvalid';
            const socket = new TestSocket(did);

            await start(socket, 'DeferredAllInvalid');
            await waitFor(
                () =>
                    credentialSearchSettledAttempts.get('DeferredAllInvalid') === 2 &&
                    !activeStartups.has(did),
                'deferred all-invalid completion'
            );
            await waitFor(
                () =>
                    timingFrames.some(
                        frame => frame.operation === 'credential_context.deferred_complete'
                    ),
                'deferred all-invalid deferred_complete'
            );

            expect(timingFrames).toContainEqual({
                operation: 'credential_context.deferred_complete',
                metadata: expect.objectContaining({ outcome: 'empty', count: 0 }),
            });
            expect(output).not.toContainEqual(
                expect.objectContaining({
                    event: 'credential_context_failed',
                    contextPhase: 'deferred',
                })
            );
            expect(events(socket, 'credential_context_status').at(-1)).toEqual(
                expect.objectContaining({ status: 'empty', count: 0 })
            );
        } finally {
            console.warn = originalWarn;
        }
    });

    it.each([
        ['DeferredTimeout', 'timeout'],
        ['DeferredAbort', 'aborted'],
    ])(
        'always emits deferred_complete when the deferred search ends early (%s)',
        async (topic, outcome) => {
            const output: unknown[] = [];
            const originalWarn = console.warn;
            console.warn = mock((...data: unknown[]) => output.push(...data));
            try {
                const did = `did:example:${topic.toLowerCase()}`;
                const socket = new TestSocket(did);

                await start(socket, topic);
                await waitFor(
                    () =>
                        credentialSearchSettledAttempts.get(topic) === 2 &&
                        !activeStartups.has(did),
                    `${topic} credential completion`
                );
                await waitFor(
                    () =>
                        timingFrames.some(
                            frame => frame.operation === 'credential_context.deferred_complete'
                        ),
                    `${topic} deferred_complete`
                );

                expect(timingFrames).toContainEqual({
                    operation: 'credential_context.complete',
                    metadata: expect.objectContaining({ outcome: 'timeout' }),
                });
                expect(timingFrames).toContainEqual({
                    operation: 'credential_context.deferred_complete',
                    metadata: expect.objectContaining({ outcome, count: 0 }),
                });
                // The server log sees how the deferred phase ended and how far it got.
                expect(output).toContainEqual({
                    event: 'credential_context_deferred_completed',
                    contextOutcome: outcome,
                    contextStage: 'search',
                    count: 0,
                    candidateCount: 0,
                    durationMs: expect.any(Number),
                });
                expect(JSON.stringify(output)).not.toContain(did);
            } finally {
                console.warn = originalWarn;
            }
        }
    );

    it('bounds the deferred context by its own budget, not what the plan left', async () => {
        const did = 'did:example:deferred-bound';
        const socket = new TestSocket(did);

        await start(socket, 'Deferred');
        await waitFor(
            () => credentialSearchSettledAttempts.get('Deferred') === 2 && !activeStartups.has(did),
            'deferred completion'
        );

        const [opening, deferred] = credentialSearchOptions.filter(
            ({ topic }) => topic === 'Deferred'
        );
        // SESSION_PLAN_TIMEOUT_MS is 1s here: the old bound ended inside it.
        expect(opening!.deadlineAt! - opening!.calledAt).toBeLessThanOrEqual(1_000);
        expect(deferred!.deadlineAt! - deferred!.calledAt).toBeGreaterThan(14_000);
        expect(deferred!.deadlineAt! - deferred!.calledAt).toBeLessThanOrEqual(15_000);
        // The query expansion the deferred search uses was warmed at start.
        expect(warmCredentialTopicExpansion).toHaveBeenCalledTimes(1);
        expect(warmCredentialTopicExpansion.mock.calls[0]?.[0]).toBe('Deferred');
    });

    it('joins a repeated start_topic on the same socket instead of restarting it', async () => {
        const did = 'did:example:dedupe';
        const socket = new TestSocket(did);
        const planner = Promise.withResolvers<void>();
        plannerGates.set('Dedupe', planner.promise);

        const first = start(socket, 'Dedupe');
        await waitFor(() => streamingStructuredAiCall.mock.calls.length === 1, 'first planner');
        const live = activeStartups.get(did);
        await start(socket, 'Dedupe');

        expect(activeStartups.get(did)).toBe(live);
        expect(live?.controller.signal.aborted).toBe(false);
        const accepted = events(socket, 'session_start_accepted');
        expect(accepted).toHaveLength(2);
        expect(accepted[1]).toEqual(accepted[0]);

        planner.resolve();
        await first;
        await settle();

        expect(createActiveSessionThread).toHaveBeenCalledTimes(1);
        expect(streamingStructuredAiCall).toHaveBeenCalledTimes(1);
        expect(events(socket, 'plan_ready')).toHaveLength(1);
        expect(events(socket, 'session_start_error')).toHaveLength(0);
    });

    it('still replaces a live start_topic for another topic or socket', async () => {
        const did = 'did:example:dedupe-other';
        const socket = new TestSocket(did);
        const planner = Promise.withResolvers<void>();
        plannerGates.set('Dedupe', planner.promise);

        const first = start(socket, 'Dedupe');
        await waitFor(() => streamingStructuredAiCall.mock.calls.length === 1, 'first planner');
        const live = activeStartups.get(did);
        const otherSocket = new TestSocket(did);
        const second = start(otherSocket, 'Dedupe');
        await waitFor(() => live?.controller.signal.aborted === true, 'replaced startup');

        expect(activeStartups.get(did)).not.toBe(live);
        planner.resolve();
        await Promise.all([first, second]);
        await settle();
        expect(createActiveSessionThread).toHaveBeenCalledTimes(2);
        expect(events(otherSocket, 'plan_ready')).toHaveLength(1);
    });

    it('refreshes provisional context after pending ingestion settles', async () => {
        ingestionPending = true;
        const socket = new TestSocket('did:example:pending-ingestion');

        await start(socket, 'Ready');
        await waitFor(
            () => !activeStartups.has('did:example:pending-ingestion'),
            'pending ingestion credential refresh'
        );

        expect(waitForCredentialIngestion).toHaveBeenCalledTimes(1);
        expect(ingestionWaitTimeouts[0]).toBeLessThanOrEqual(30);
        expect(credentialSearchAttempts.get('Ready')).toBe(2);
        expect(events(socket, 'credential_context_status')).toEqual([
            expect.objectContaining({ status: 'pending', count: 0 }),
            expect.objectContaining({ status: 'pending', count: 1 }),
            expect.objectContaining({ status: 'ready', count: 1 }),
        ]);
        expect(events(socket, 'plan_ready')).toHaveLength(1);
    });

    it('completes Google-backed credential context without title AI work', async () => {
        titleProvider = 'google';
        const socket = new TestSocket('did:example:google');

        await start(socket, 'GoogleDeferred');
        await waitFor(
            () =>
                credentialSearchSettledAttempts.get('GoogleDeferred') === 2 &&
                !activeStartups.has('did:example:google'),
            'Google credential completion'
        );

        expect(credentialSearchAttempts.get('GoogleDeferred')).toBe(2);
        expect(
            credentialSearchOptions
                .filter(({ topic }) => topic === 'GoogleDeferred')
                .every(({ expandQueries }) => expandQueries === false)
        ).toBe(true);
        // v198 Math: the opening uses stored text; the deferred search verifies live.
        expect(
            credentialSearchOptions
                .filter(({ topic }) => topic === 'GoogleDeferred')
                .map(({ preferStoredText }) => preferStoredText)
        ).toEqual([true, undefined]);
        expect(enrichCredentialTitles).not.toHaveBeenCalled();
        expect(warmCredentialTopicExpansion).not.toHaveBeenCalled();
        expect(events(socket, 'credentials_for_topic')).toEqual([
            expect.objectContaining({ credentials: [credentialContext] }),
        ]);
    });

    // v194 Math: the deferred search was aborted at 6.7s of its 15s budget by
    // its startup's controller, not its deadline, and stored nothing.
    it('v194: a deferred context outlives a closed socket and is stored', async () => {
        const did = 'did:example:deferred-closed';
        const socket = new TestSocket(did);
        const credentialGate = Promise.withResolvers<void>();
        credentialCompletionGates.set('DeferredClosed', credentialGate.promise);

        await start(socket, 'DeferredClosed');
        await waitFor(
            () => credentialSearchAttempts.get('DeferredClosed') === 2,
            'deferred search started'
        );
        await websocketHandler.close(asSocket(socket));
        credentialGate.resolve();
        await waitFor(
            () => credentialSearchSettledAttempts.get('DeferredClosed') === 2,
            'deferred search settled'
        );
        await waitFor(() => operations.includes('credentials:1'), 'deferred credentials stored');

        expect(db.storeThreadCredentials).toHaveBeenCalledWith(did, expect.any(String), [
            expect.objectContaining({ uri: credentialContext.uri }),
        ]);
    });

    it('keeps newer startup ownership when deferred completion settles', async () => {
        const did = 'did:example:deferred';
        const deferredSocket = new TestSocket(did);
        const winnerSocket = new TestSocket(did);
        const credentialGate = Promise.withResolvers<void>();
        const plannerGate = Promise.withResolvers<void>();
        credentialCompletionGates.set('Deferred', credentialGate.promise);
        plannerGates.set('Winner', plannerGate.promise);

        await start(deferredSocket, 'Deferred');
        await settle();
        const deferredStartup = activeStartups.get(did);

        expect(credentialSearchAttempts.get('Deferred')).toBe(2);
        expect(deferredStartup?.ws).toBe(asSocket(deferredSocket));

        const winnerStart = start(winnerSocket, 'Winner');
        await settle();
        const winnerStartup = activeStartups.get(did);

        expect(winnerStartup?.ws).toBe(asSocket(winnerSocket));

        credentialGate.resolve();
        await waitFor(
            () => credentialSearchSettledAttempts.get('Deferred') === 2,
            'superseded deferred completion'
        );

        expect(activeStartups.get(did)).toBe(winnerStartup);

        plannerGate.resolve();
        await winnerStart;
    });

    it('does not repeat credential searches for pending or empty threads', async () => {
        const socket = new TestSocket('did:example:normal');

        normalCredentialState = { status: 'pending', title: 'Pending' };
        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-pending',
                message: { role: 'user', content: 'Pending question' },
            })
        );

        normalCredentialState = { status: 'empty', title: 'Empty' };
        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-empty',
                message: { role: 'user', content: 'Empty question' },
            })
        );

        expect(searchCredentialsByTopic).not.toHaveBeenCalled();
        expect(db.claimThreadCredentialContextSearch).not.toHaveBeenCalled();
    });

    it('claims one legacy credential search and never searches undefined', async () => {
        const socket = new TestSocket('did:example:legacy');
        claimLegacySearch = true;

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-legacy',
                message: { role: 'user', content: 'First question' },
            })
        );
        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                threadId: 'thread-legacy',
                message: { role: 'user', content: 'Second question' },
            })
        );

        expect(searchCredentialsByTopic).toHaveBeenCalledTimes(1);
        expect(searchCredentialsByTopic).toHaveBeenCalledWith('Legacy', 'did:example:legacy', {
            limit: 5,
        });
        expect(searchCredentialsByTopic.mock.calls.every(([topic]) => topic !== undefined)).toBe(
            true
        );
    });

    it('routes new Insights sessions through active-session ownership', async () => {
        const socket = new TestSocket('did:example:insights');

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                mode: 'ai-insights',
                topic: 'Career options',
                message: { role: 'user', content: 'Compare my options' },
            })
        );

        expect(createActiveSessionThread).toHaveBeenCalledTimes(1);
        expect(createActiveSessionThread.mock.calls[0]?.slice(0, 2)).toEqual([
            'did:example:insights',
            'Career options',
        ]);
        expect(createActiveSessionThread.mock.calls[0]?.[4]).toBe('ai-insights');
        expect(events(socket, 'insights_ready')).toEqual([
            expect.objectContaining({ threadId: 'thread-1' }),
        ]);
    });

    it('returns a typed quota error when an Insights response is rejected', async () => {
        const socket = new TestSocket('did:example:insights-quota');

        streamingAiCall.mockImplementationOnce(async () => {
            throw new AiProviderError({
                code: 'ai_provider_quota_exhausted',
                provider: 'openai',
                retryable: false,
                httpStatus: 503,
            });
        });

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({
                mode: 'ai-insights',
                topic: 'Career options',
                message: { role: 'user', content: 'What roles align with my skills?' },
            })
        );

        expect(events(socket, 'ai_error')).toEqual([
            expect.objectContaining({
                code: 'ai_provider_quota_exhausted',
                retryable: false,
                operation: 'chat',
                threadId: 'thread-1',
            }),
        ]);
    });

    it('allows only one stored plan continuation to start', async () => {
        const socket = new TestSocket('did:example:plan');
        db.getThreadPlans.mockImplementationOnce(async () => [
            { plan_data: planJson, created_at: new Date().toISOString() },
        ]);
        db.startThreadPlan.mockImplementationOnce(async () => false);

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({ action: 'continue_plan', threadId: 'thread-plan' })
        );

        expect(streamingAiCall).not.toHaveBeenCalled();
        expect(events(socket, 'thread_updated')).toEqual([
            expect.objectContaining({ threadId: 'thread-plan', phase: 'ready' }),
        ]);
    });

    it('releases a stored plan continuation after failure', async () => {
        const socket = new TestSocket('did:example:retry-plan');
        db.getThreadPlans.mockImplementationOnce(async () => [
            { plan_data: planJson, created_at: new Date().toISOString() },
        ]);
        db.getThreadCredentialContextState.mockImplementationOnce(async () => {
            throw new Error('credential state unavailable');
        });

        await websocketHandler.message(
            asSocket(socket),
            JSON.stringify({ action: 'continue_plan', threadId: 'thread-plan' })
        );

        expect(db.resetThreadPlanStarted).toHaveBeenCalledWith(
            'thread-plan',
            'did:example:retry-plan'
        );
        expect(events(socket, 'thread_updated')).toEqual([
            expect.objectContaining({ threadId: 'thread-plan', phase: 'error' }),
        ]);
    });

    it('spends one absolute budget and sends one friendly timeout terminal frame', async () => {
        const delayedSocket = new TestSocket('did:example:delayed');
        await start(delayedSocket, 'Delayed');

        expect(plannerTimeouts[0]).toBeLessThan(950);
        const timeoutSocket = new TestSocket('did:example:timeout');
        await start(timeoutSocket, 'Timeout');

        expect(events(timeoutSocket, 'session_start_error')).toEqual([
            expect.objectContaining({
                code: 'plan_timeout',
                error: 'Something went wrong. Please try again.',
            }),
        ]);
    });
});
