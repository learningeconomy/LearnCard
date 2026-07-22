/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    fetch: vi.fn(),
    showErrorModal: vi.fn(),
}));

vi.mock('./authStore', () => ({
    auth: { get: () => ({ did: 'did:example:learner' }) },
}));
vi.mock('./artifactsStore', () => ({ resetArtifactsStore: vi.fn() }));
vi.mock('./toastStore', () => ({ showToast: { set: vi.fn() } }));
vi.mock('./ErrorModalStore', () => ({ showErrorModal: mocks.showErrorModal }));
vi.mock('../NetworkStore', () => ({
    networkStore: { get: { aiServiceUrl: () => 'http://localhost:3001' } },
}));
vi.mock('../../logging/logger', () => ({
    getLogger: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    }),
}));

type MessageHandler = ((event: MessageEvent<string>) => void) | null;
type SocketHandler = (() => void) | null;

class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 3;
    static instances: FakeWebSocket[] = [];

    readonly sent: string[] = [];
    readyState = FakeWebSocket.CONNECTING;
    onmessage: MessageHandler = null;
    onopen: SocketHandler = null;
    onclose: SocketHandler = null;
    onerror: SocketHandler = null;

    constructor(readonly url: string) {
        FakeWebSocket.instances.push(this);
    }

    open() {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }

    close() {
        this.readyState = FakeWebSocket.CLOSED;
        queueMicrotask(() => this.onclose?.());
    }

    send(payload: string) {
        this.sent.push(payload);
    }

    receive(payload: Record<string, unknown>) {
        this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
    }
}

globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
globalThis.fetch = mocks.fetch as typeof fetch;

// The store must capture the fake browser WebSocket during module initialization.
const {
    connectWebSocket,
    credentialContextReadiness,
    currentThreadId,
    disconnectWebSocket,
    isLoading,
    isTyping,
    messages,
    planReady,
    planReadyThread,
    planSections,
    planStreamActive,
    resetChatStores,
    sendMessage,
    sessionEnded,
    startTopic,
    threads,
} = await import('./chatStore');

const openLatestSocket = async (): Promise<FakeWebSocket> => {
    await Promise.resolve();
    const socket = FakeWebSocket.instances.at(-1);

    if (!socket) throw new Error('Expected a WebSocket connection');

    socket.open();
    await Promise.resolve();

    return socket;
};

describe('chat session startup', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeWebSocket.instances = [];
        mocks.showErrorModal.mockClear();
        mocks.fetch.mockClear();
        resetChatStores();
    });

    afterEach(() => {
        disconnectWebSocket();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('starts over the socket without a REST preflight and sends the structured payload', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;

        expect(mocks.fetch).not.toHaveBeenCalled();
        expect(socket.sent.map(payload => JSON.parse(payload))).toEqual([
            {
                action: 'start_topic',
                topic: 'Algebra',
                introStreamMode: 'structured',
                did: 'did:example:learner',
                mode: 'ai-tutor',
            },
        ]);
    });

    it('renders partial structured fields as soon as they arrive', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-plan' });
        socket.receive({
            event: 'plan_structured_delta',
            requestId: 'request-plan',
            planData: { welcome: 'Welcome to Algebra' },
        });

        expect(planStreamActive.get()).toBe(true);
        expect(planSections.get()).toEqual({
            welcome: 'Welcome to Algebra',
            summary: '',
            objectives: [],
            skills: [],
            roadmap: [],
        });
    });

    it('keeps ended threads read-only while preserving legacy threads with omitted state', async () => {
        connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('ended-thread');
        threads.set([
            {
                id: 'ended-thread',
                did: 'did:example:learner',
                title: 'Ended',
                created_at: '2026-01-01T00:00:00.000Z',
                last_message_at: '2026-01-01T00:00:00.000Z',
                active: false,
            },
        ]);

        sendMessage('Should not send');

        expect(socket.sent).toHaveLength(0);
        expect(messages.get()).toHaveLength(0);
        expect(sessionEnded.get()).toBe(true);

        sessionEnded.set(false);
        currentThreadId.set('legacy-thread');
        threads.set([
            {
                id: 'legacy-thread',
                did: 'did:example:learner',
                title: 'Legacy',
                created_at: '2026-01-01T00:00:00.000Z',
                last_message_at: '2026-01-01T00:00:00.000Z',
            },
        ]);

        sendMessage('Continue learning');

        expect(socket.sent).toHaveLength(1);
        expect(messages.get().at(-1)?.content).toBe('Continue learning');
        expect(sessionEnded.get()).toBe(false);
    });

    it('tracks credential readiness separately from plan readiness', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-context' });
        socket.receive({
            event: 'credential_context_status',
            requestId: 'request-context',
            threadId: 'thread-context',
            status: 'pending',
            count: 0,
            ingestionPhase: 'active',
        });
        socket.receive({
            event: 'plan_ready',
            requestId: 'request-context',
            threadId: 'thread-context',
            title: 'Algebra',
        });

        expect(planReady.get()).toBe(true);
        expect(credentialContextReadiness.get()).toEqual({
            status: 'pending',
            count: 0,
            ingestionPhase: 'active',
        });
        expect(
            threads.get().find(thread => thread.id === 'thread-context')?.credentialContextStatus
        ).toBe('pending');

        socket.receive({
            event: 'credential_context_status',
            requestId: 'stale-request',
            threadId: 'thread-context',
            status: 'error',
            count: 0,
        });
        expect(credentialContextReadiness.get().status).toBe('pending');

        socket.receive({
            event: 'credential_context_status',
            requestId: 'request-context',
            threadId: 'thread-context',
            status: 'ready',
            count: 3,
            ingestionPhase: 'ready',
        });

        expect(credentialContextReadiness.get()).toEqual({
            status: 'ready',
            count: 3,
            ingestionPhase: 'ready',
        });
        expect(
            threads.get().find(thread => thread.id === 'thread-context')?.credentialContextStatus
        ).toBe('ready');
    });

    it('preserves stored credential readiness when plan_ready has no newer status', async () => {
        threads.set([
            {
                id: 'existing-thread',
                did: 'did:example:learner',
                title: 'Existing',
                created_at: '2026-01-01T00:00:00.000Z',
                last_message_at: '2026-01-01T00:00:00.000Z',
                credentialContextStatus: 'ready',
            },
        ]);

        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-existing' });
        socket.receive({
            event: 'plan_ready',
            requestId: 'request-existing',
            threadId: 'existing-thread',
            title: 'Updated',
        });

        expect(threads.get()[0]).toMatchObject({
            title: 'Updated',
            credentialContextStatus: 'ready',
        });
    });

    it.each([
        { event: 'session_start_error', requestId: 'request-error' },
        { error: 'provider failed', requestId: 'request-error' },
    ])('terminates loading for startup error frame %#', async errorFrame => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-error' });
        socket.receive({
            event: 'plan_structured_delta',
            requestId: 'request-error',
            planData: { welcome: 'Partial' },
        });
        socket.receive(errorFrame);

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(planStreamActive.get()).toBe(false);
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try starting the session again.'
        );
    });

    it('terminates loading for a legacy startup error before request acceptance', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ error: 'legacy provider failed' });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try starting the session again.'
        );
    });

    it('ignores untagged startup frames after a request is accepted', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-current' });
        socket.receive({ error: 'stale provider failed' });

        expect(isLoading.get()).toBe(true);
        expect(isTyping.get()).toBe(true);
        expect(mocks.showErrorModal).not.toHaveBeenCalled();
    });

    it('ignores completion frames for another browser session', async () => {
        connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('current-thread');

        socket.receive({
            event: 'conversation_summary',
            threadId: 'other-thread',
            credentialUri: 'lc:summary:other',
            summary: {},
        });
        socket.receive({ event: 'no_conversation_summary', threadId: 'other-thread' });
        socket.receive({ event: 'session_completed', threadId: 'other-thread' });

        expect(sessionEnded.get()).toBe(false);

        socket.receive({ event: 'no_conversation_summary', threadId: 'current-thread' });

        expect(sessionEnded.get()).toBe(true);
    });

    it('shows the app error modal when the AI backend is offline', async () => {
        const start = startTopic('Offline topic');

        await vi.advanceTimersByTimeAsync(5_000);
        await start;

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Connection Error',
            'Could not connect to the chat service. Please try again later.'
        );
    });

    it('ignores a stale terminal frame after a newer start is accepted', async () => {
        const firstStart = startTopic('First topic');
        const firstSocket = await openLatestSocket();
        await firstStart;
        firstSocket.receive({ event: 'session_start_accepted', requestId: 'request-1' });

        const secondStart = startTopic('Second topic');
        const secondSocket = await openLatestSocket();
        await secondStart;
        secondSocket.receive({ event: 'session_start_accepted', requestId: 'request-2' });
        secondSocket.receive({
            event: 'plan_ready',
            requestId: 'request-1',
            threadId: 'stale-thread',
            title: 'First topic',
        });

        expect(isLoading.get()).toBe(true);
        expect(isTyping.get()).toBe(true);
        expect(planReady.get()).toBe(false);

        secondSocket.receive({
            event: 'plan_ready',
            requestId: 'request-2',
            threadId: 'current-thread',
            title: 'Second topic',
        });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(planReady.get()).toBe(true);
        expect(planReadyThread.get()).toBe('current-thread');
    });

    it('ends a silent startup with friendly feedback after 32 seconds', async () => {
        const start = startTopic('Silent topic');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-silent' });

        await vi.advanceTimersByTimeAsync(31_999);
        expect(isLoading.get()).toBe(true);
        expect(mocks.showErrorModal).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try starting the session again.'
        );
    });
});
