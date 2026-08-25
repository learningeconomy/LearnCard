/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeferred } from '../../helpers/deferred';

const mocks = vi.hoisted(() => ({
    authMode: 'session' as 'legacy' | 'session' | undefined,
    ensureCalls: 0,
    ensureError: null as Error | null,
    ensureMode: 'session' as 'legacy' | 'session',
    ensureGate: null as Promise<void> | null,
    fetch: vi.fn(),
    showErrorModal: vi.fn(),
    ticketCount: 0,
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
vi.mock('../walletStore', () => ({
    walletStore: {
        get: { wallet: () => ({ id: { did: () => 'did:example:learner' } }) },
    },
}));
vi.mock('../../helpers/aiPassportAuth', () => {
    const getUrl = (path: string, did?: string) => {
        const url = new URL(path, 'http://localhost:3001');

        if (mocks.authMode === 'legacy' && did) url.searchParams.set('did', did);

        return url;
    };

    return {
        aiPassportFetch: (path: string, init: RequestInit = {}, did?: string) =>
            mocks.fetch(getUrl(path, did), { ...init, credentials: 'include' }),
        ensureAiPassportSession: async () => {
            mocks.ensureCalls += 1;
            if (mocks.ensureError) throw mocks.ensureError;
            if (mocks.ensureGate) await mocks.ensureGate;

            mocks.authMode = mocks.ensureMode;
            return mocks.authMode;
        },
        getAiPassportAuthMode: () => mocks.authMode,
        getAiPassportWebSocketProtocols: async () =>
            mocks.authMode === 'session'
                ? [
                      'ai-passport',
                      `ai-passport-ticket.ticket-${String(++mocks.ticketCount).padStart(32, '0')}`,
                  ]
                : undefined,
        getAiPassportUrl: getUrl,
        waitForAiPassportAuthMode: async () => mocks.authMode,
    };
});
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

    constructor(readonly url: string, readonly protocols?: string | string[]) {
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

    receive(payload: unknown) {
        this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
    }
}

globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
globalThis.fetch = mocks.fetch as typeof fetch;

const localeStorageValues = new Map<string, string>();
const localeStorage: Storage = {
    get length() {
        return localeStorageValues.size;
    },
    clear: () => localeStorageValues.clear(),
    getItem: key => localeStorageValues.get(key) ?? null,
    key: index => Array.from(localeStorageValues.keys())[index] ?? null,
    removeItem: key => localeStorageValues.delete(key),
    setItem: (key, value) => localeStorageValues.set(key, value),
};
vi.stubGlobal('localStorage', localeStorage);

if (!Promise.withResolvers) {
    Promise.withResolvers = <T>() => {
        let resolve!: PromiseWithResolvers<T>['resolve'];
        let reject!: PromiseWithResolvers<T>['reject'];
        const promise = new Promise<T>((promiseResolve, promiseReject) => {
            resolve = promiseResolve;
            reject = promiseReject;
        });

        return { promise, resolve, reject };
    };
}
// The store must capture the fake browser WebSocket during module initialization.
const {
    connectWebSocket,
    closeInsightsSession,
    continuePlan,
    credentialContextReadiness,
    currentThreadId,
    getActiveSessionStatus,
    finishSession,
    disconnectWebSocket,
    isLoading,
    lastAiError,
    isTyping,
    messages,
    planReady,
    planReadyThread,
    planSections,
    planStreamActive,
    resetChatStores,
    sendMessage,
    sessionEnded,
    startInsightsSession,
    startTopic,
    threads,
} = await import('./chatStore');

const openLatestSocket = async (): Promise<FakeWebSocket> => {
    for (let attempt = 0; attempt < 10; attempt += 1) await Promise.resolve();

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
        mocks.authMode = 'session';
        mocks.ensureCalls = 0;
        mocks.ensureError = null;
        mocks.ensureGate = null;
        mocks.ensureMode = 'session';
        mocks.ticketCount = 0;
        // getActiveLocale reads this key; clear it so cases that don't set a
        // language get the 'en' default rather than a previous test's value.
        localStorage.removeItem('i18n.language');
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
        expect(new URL(socket.url).searchParams.has('did')).toBe(false);
        expect(socket.protocols).toEqual([
            'ai-passport',
            'ai-passport-ticket.ticket-00000000000000000000000000000001',
        ]);
        expect(socket.sent.map(payload => JSON.parse(payload))).toEqual([
            {
                action: 'start_topic',
                topic: 'Algebra',
                introStreamMode: 'structured',
                mode: 'ai-tutor',
                // LC-1901: every outbound frame carries the UI locale so the AI
                // replies in the user's language. Defaults to 'en'.
                locale: 'en',
            },
        ]);
    });

    it('disconnects the previous socket before waiting for auth negotiation', async () => {
        const firstStart = startTopic('First topic');
        const firstSocket = await openLatestSocket();

        await firstStart;

        mocks.authMode = 'legacy';
        mocks.ensureMode = 'session';
        const { promise, resolve } = Promise.withResolvers<void>();

        mocks.ensureGate = promise;

        const secondStart = startTopic('Second topic');

        await Promise.resolve();

        expect(firstSocket.readyState).toBe(FakeWebSocket.CLOSED);

        resolve();

        const secondSocket = await openLatestSocket();

        await secondStart;

        expect(secondSocket).not.toBe(firstSocket);
    });

    it('uses the legacy DID query only for a legacy backend', async () => {
        mocks.authMode = 'legacy';
        mocks.ensureMode = 'legacy';

        const start = startTopic('Legacy Algebra');
        await Promise.resolve();
        await Promise.resolve();
        const socket = await openLatestSocket();

        await start;

        expect(new URL(socket.url).searchParams.get('did')).toBe('did:example:learner');
        expect(socket.protocols).toBeUndefined();
        expect(JSON.parse(socket.sent[0]!)).not.toHaveProperty('did');
    });

    it('actively negotiates before the cold active-session preflight', async () => {
        mocks.authMode = undefined;
        mocks.ensureMode = 'legacy';
        mocks.fetch.mockResolvedValueOnce(Response.json({ isActive: false, activeThreadId: null }));

        await expect(getActiveSessionStatus()).resolves.toEqual({
            isActive: false,
            activeThreadId: null,
        });

        const requestUrl = new URL(mocks.fetch.mock.calls[0]![0] as URL);

        expect(requestUrl.pathname).toBe('/api/chat/active-session-status');
        expect(requestUrl.searchParams.get('did')).toBe('did:example:learner');
    });

    it('finalizes session JSON without caller DID transport in session mode', async () => {
        currentThreadId.set('thread-session');
        mocks.fetch.mockResolvedValueOnce(
            Response.json({ event: 'no_conversation_summary', threadId: 'thread-session' })
        );

        await finishSession();

        const [request, options] = mocks.fetch.mock.calls[0]!;
        const url = new URL(request as URL);
        const headers = new Headers(options.headers);
        const body = JSON.parse(options.body as string);

        expect(url.pathname).toBe('/threads/finish');
        expect(url.searchParams.has('did')).toBe(false);
        expect(url.toString()).not.toContain('did:example:learner');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(body).toEqual({ threadId: 'thread-session' });
        expect(options.body).not.toContain('did:example:learner');
    });

    it('limits legacy session finalization DID transport to the compatibility query', async () => {
        mocks.authMode = 'legacy';
        mocks.ensureMode = 'legacy';
        currentThreadId.set('thread-legacy');
        mocks.fetch.mockResolvedValueOnce(
            Response.json({ event: 'no_conversation_summary', threadId: 'thread-legacy' })
        );

        await finishSession();

        const [request, options] = mocks.fetch.mock.calls[0]!;
        const url = new URL(request as URL);
        const headers = new Headers(options.headers);

        expect(url.searchParams.get('did')).toBe('did:example:learner');
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(JSON.parse(options.body as string)).toEqual({ threadId: 'thread-legacy' });
        expect(options.body).not.toContain('did:example:learner');
    });

    it('renegotiates before reconnecting a legacy socket after backend rollout', async () => {
        mocks.authMode = 'legacy';
        mocks.ensureMode = 'legacy';

        const start = startTopic('Long-running legacy session');
        await Promise.resolve();
        await Promise.resolve();
        const legacySocket = await openLatestSocket();

        await start;
        expect(new URL(legacySocket.url).searchParams.get('did')).toBe('did:example:learner');

        mocks.ensureMode = 'session';
        legacySocket.close();
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(1000);
        await Promise.resolve();
        await Promise.resolve();

        const sessionSocket = FakeWebSocket.instances.at(-1);

        expect(sessionSocket).not.toBe(legacySocket);
        expect(new URL(sessionSocket!.url).searchParams.has('did')).toBe(false);
    });

    it('uses a fresh one-time ticket for every authenticated reconnect', async () => {
        const start = startTopic('Ticket rotation');
        const firstSocket = await openLatestSocket();

        await start;
        firstSocket.close();
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(1000);
        const secondSocket = FakeWebSocket.instances.at(-1);

        expect(secondSocket).not.toBe(firstSocket);
        expect(firstSocket.protocols).toEqual([
            'ai-passport',
            'ai-passport-ticket.ticket-00000000000000000000000000000001',
        ]);
        expect(secondSocket?.protocols).toEqual([
            'ai-passport',
            'ai-passport-ticket.ticket-00000000000000000000000000000002',
        ]);
        expect(firstSocket.url).not.toContain('ticket-');
        expect(secondSocket?.url).not.toContain('ticket-');
    });

    it('counts each failed reconnect once and enforces the exact maximum', async () => {
        const start = startTopic('Reconnect budget');
        const socket = await openLatestSocket();

        await start;
        isTyping.set(true);
        isLoading.set(true);
        mocks.authMode = 'legacy';
        mocks.ensureError = new Error('authentication unavailable');
        socket.close();
        await Promise.resolve();

        for (let attempt = 1; attempt <= 5; attempt += 1) {
            await vi.advanceTimersByTimeAsync(1000);
            expect(mocks.ensureCalls).toBe(attempt);
        }

        await vi.advanceTimersByTimeAsync(5000);

        expect(mocks.ensureCalls).toBe(5);
        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(isTyping.get()).toBe(false);
        expect(isLoading.get()).toBe(false);
    });

    it('resets the reconnect budget after a successful open', async () => {
        const start = startTopic('Reconnect reset');
        const firstSocket = await openLatestSocket();

        await start;
        mocks.authMode = 'legacy';
        mocks.ensureMode = 'session';
        firstSocket.close();
        await Promise.resolve();
        await vi.advanceTimersByTimeAsync(1000);

        const secondSocket = FakeWebSocket.instances.at(-1)!;

        secondSocket.open();
        mocks.authMode = 'legacy';
        mocks.ensureError = new Error('authentication unavailable');
        secondSocket.close();
        await Promise.resolve();

        for (let attempt = 0; attempt < 5; attempt += 1) {
            await vi.advanceTimersByTimeAsync(1000);
        }

        expect(mocks.ensureCalls).toBe(6);
        expect(isTyping.get()).toBe(false);
        expect(isLoading.get()).toBe(false);
    });

    it('cancels a scheduled reconnect after deliberate disconnect', async () => {
        const start = startTopic('Deliberate disconnect');
        const socket = await openLatestSocket();

        await start;
        socket.close();
        await Promise.resolve();
        disconnectWebSocket();
        await vi.advanceTimersByTimeAsync(5000);

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(mocks.ensureCalls).toBe(0);
    });
    // LC-1901: the locale rides on both the socket URL (read at connect time)
    // and every payload (read per message), so assert both actually track the
    // stored language rather than the 'en' default.
    it('carries the active locale on the socket URL and the start payload', async () => {
        localStorage.setItem('i18n.language', 'es');

        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;

        expect(new URL(socket.url).searchParams.get('locale')).toBe('es');
        expect(JSON.parse(socket.sent[0]!)).toMatchObject({ locale: 'es' });
    });

    it('sanitizes a tampered locale before it reaches the backend', async () => {
        localStorage.setItem('i18n.language', 'es"&evil=1');

        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;

        expect(JSON.parse(socket.sent[0]!)).toMatchObject({ locale: 'esevil1' });
        expect(socket.url).not.toContain('evil=1');
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
        await connectWebSocket();
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

    it('records typed quota errors and clears startup state without generic modal copy', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-quota' });
        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
            operation: 'session_start',
            requestId: 'request-quota',
        });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(planStreamActive.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            retryable: false,
            operation: 'session_start',
            requestId: 'request-quota',
        });
        expect(mocks.showErrorModal).not.toHaveBeenCalled();
    });

    it('terminates startup for unknown typed error codes', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-future' });
        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_future_failure',
            message: 'Safe public message',
            retryable: false,
            requestId: 'request-future',
        });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            code: 'ai_unknown_error',
            rawCode: 'ai_provider_future_failure',
        });
    });

    it('stops pending response indicators immediately when the WebSocket errors', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;

        expect(isLoading.get()).toBe(true);
        expect(isTyping.get()).toBe(true);

        socket.onerror?.();

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(planStreamActive.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({ code: 'websocket_error' });
    });

    it('preserves a partial assistant response when a typed AI error interrupts streaming', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-stream');
        messages.set([{ role: 'user', content: 'My question' }]);

        socket.receive('Partial answer');
        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
            operation: 'chat',
            threadId: 'thread-stream',
        });

        expect(messages.get().map(message => message.content)).toEqual([
            'My question',
            'Partial answer',
        ]);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            code: 'ai_provider_quota_exhausted',
            threadId: 'thread-stream',
        });
    });

    it('preserves a partial assistant response when a legacy error interrupts streaming', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-legacy-stream');
        messages.set([{ role: 'user', content: 'My question' }]);

        socket.receive('Partial answer');
        socket.receive({ error: 'provider failed' });

        expect(messages.get().map(message => message.content)).toEqual([
            'My question',
            'Partial answer',
        ]);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            code: 'provider failed',
            presented: false,
        });
    });

    it('does not resurrect typing when a responding frame arrives after a quota error', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-quota');
        isTyping.set(true);

        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
            operation: 'chat',
            threadId: 'thread-quota',
        });
        socket.receive({
            event: 'thread_updated',
            threadId: 'thread-quota',
            phase: 'responding',
        });
        socket.receive({
            event: 'assistant_typing',
            threadId: 'thread-quota',
        });

        expect(lastAiError.get()).toMatchObject({
            code: 'ai_provider_quota_exhausted',
            threadId: 'thread-quota',
        });
        expect(isTyping.get()).toBe(false);
    });

    it('ignores typed AI errors correlated to a stale startup request', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-current' });
        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
            requestId: 'request-stale',
        });

        expect(isLoading.get()).toBe(true);
        expect(lastAiError.get()).toBeNull();
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

    it('accepts an untagged startup error from the current socket', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-current' });
        socket.receive({ error: 'provider failed' });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({ code: 'provider failed' });
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try starting the session again.'
        );
    });

    it('clears the previous Insights thread before accepting frames for the new socket', async () => {
        currentThreadId.set('stale-thread');

        const start = startInsightsSession('Career options');

        await Promise.resolve();
        expect(currentThreadId.get()).toBeNull();

        const socket = await openLatestSocket();

        await start;
        socket.receive({ event: 'insights_ready', threadId: 'fresh-thread' });
        socket.receive({ event: 'assistant_typing', threadId: 'fresh-thread' });

        expect(currentThreadId.get()).toBe('fresh-thread');
        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(true);

        socket.receive({ done: true, threadId: 'fresh-thread' });

        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
    });

    it('accepts an untagged Insights error after a correlated topic startup', async () => {
        const topicStart = startTopic('Algebra');
        const topicSocket = await openLatestSocket();
        await topicStart;
        topicSocket.receive({ event: 'session_start_accepted', requestId: 'request-topic' });
        topicSocket.receive({
            event: 'plan_ready',
            requestId: 'request-topic',
            threadId: 'thread-topic',
            title: 'Algebra',
        });

        const insightsStart = startInsightsSession('Career options');
        const insightsSocket = await openLatestSocket();
        await insightsStart;
        insightsSocket.receive({
            event: 'session_start_accepted',
            requestId: 'request-insights',
        });
        insightsSocket.receive({ error: 'Insufficient credits' });

        expect(lastAiError.get()).toMatchObject({ code: 'Insufficient credits' });
        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
    });

    it('ignores completion frames for another browser session', async () => {
        await connectWebSocket();
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

    it('marks a session ended when another tab replaces it', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-current');
        threads.set([
            {
                id: 'thread-current',
                did: 'did:example:learner',
                title: 'Current session',
                created_at: '2026-01-01T00:00:00.000Z',
                last_message_at: '2026-01-01T00:00:00.000Z',
                active: true,
            },
        ]);
        isTyping.set(true);

        socket.receive({
            event: 'session_replaced',
            threadId: 'thread-current',
        });

        expect(socket.readyState).toBe(FakeWebSocket.CLOSED);
        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(sessionEnded.get()).toBe(true);
        expect(threads.get()[0]).toMatchObject({
            active: false,
            ended_at: expect.any(String),
        });
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Session opened elsewhere',
            'This session ended because a new AI session was started in another tab or device.'
        );
    });

    it('reports a non-fatal topic publication failure after the session is ready', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-current');

        socket.receive({
            event: 'topic_publication_status',
            threadId: 'thread-current',
            status: 'error',
        });

        expect(sessionEnded.get()).toBe(false);
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Progress may not be saved',
            'You can keep learning, but progress from this session may not be saved. Check your AI access settings and try again.'
        );
    });

    it('reloads a shared thread when another tab finishes a response', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-current');
        threads.set([
            {
                id: 'thread-current',
                did: 'did:example:learner',
                title: 'Current session',
                created_at: '2026-01-01T00:00:00.000Z',
                last_message_at: '2026-01-01T00:00:00.000Z',
                active: true,
            },
        ]);
        isTyping.set(true);
        mocks.fetch
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify([
                        { role: 'user', content: 'Question from another tab' },
                        { role: 'assistant', content: 'Shared response' },
                    ])
                )
            )
            .mockResolvedValueOnce(new Response(JSON.stringify([])));

        socket.receive({
            event: 'thread_updated',
            threadId: 'thread-current',
            phase: 'ready',
        });
        await vi.waitFor(() => {
            expect(messages.get()).toEqual([
                { role: 'user', content: 'Question from another tab' },
                { role: 'assistant', content: 'Shared response' },
            ]);
            expect(isTyping.get()).toBe(false);
        });

        isTyping.set(true);
        mocks.fetch
            .mockResolvedValueOnce(new Response(JSON.stringify(messages.get())))
            .mockResolvedValueOnce(new Response(JSON.stringify([])));
        socket.receive({
            event: 'thread_updated',
            threadId: 'thread-current',
            phase: 'error',
        });
        await vi.waitFor(() => {
            expect(isTyping.get()).toBe(false);
        });
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

    it('ends a silent Insights response with friendly feedback after 32 seconds', async () => {
        const start = startInsightsSession('Career fit');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'insights_ready', threadId: 'thread-insights' });
        socket.receive({ event: 'assistant_typing', threadId: 'thread-insights' });

        await vi.advanceTimersByTimeAsync(31_999);
        expect(isTyping.get()).toBe(true);
        expect(lastAiError.get()).toBeNull();

        await vi.advanceTimersByTimeAsync(1);
        expect(isLoading.get()).toBe(false);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({ code: 'startup_timeout' });
    });

    it('keeps Insights typing feedback visible across an automatic reconnect', async () => {
        const start = startInsightsSession('Career fit');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'insights_ready', threadId: 'thread-insights' });
        socket.receive({ event: 'assistant_typing', threadId: 'thread-insights' });

        socket.close();
        await Promise.resolve();

        expect(isTyping.get()).toBe(true);

        await vi.advanceTimersByTimeAsync(1_000);
        const reconnectedSocket = FakeWebSocket.instances.at(-1);

        expect(reconnectedSocket).not.toBe(socket);
        reconnectedSocket?.open();
        expect(isTyping.get()).toBe(true);

        reconnectedSocket?.receive({ done: true, threadId: 'thread-insights' });
        expect(isTyping.get()).toBe(false);
    });

    it('does not reconnect a deliberately disconnected socket to close Insights', async () => {
        currentThreadId.set('thread-insights');
        await connectWebSocket();
        const socket = await openLatestSocket();

        disconnectWebSocket();
        await closeInsightsSession();
        await vi.advanceTimersByTimeAsync(1_000);

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(socket.sent).not.toContainEqual(expect.stringContaining('close_insights_session'));
    });

    it('accepts a continuation error carrying the startup request ID', async () => {
        const start = startTopic('Algebra');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'session_start_accepted', requestId: 'request-continuation' });
        socket.receive({
            event: 'plan_ready',
            requestId: 'request-continuation',
            threadId: 'thread-continuation',
            title: 'Algebra',
        });

        continuePlan();
        socket.receive({
            event: 'ai_error',
            code: 'ai_provider_quota_exhausted',
            message: 'Safe public message',
            retryable: false,
            requestId: 'request-continuation',
            threadId: 'thread-continuation',
        });

        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            code: 'ai_provider_quota_exhausted',
            requestId: 'request-continuation',
        });
    });

    it('ends a silent plan continuation after 32 seconds', async () => {
        await connectWebSocket();
        const socket = await openLatestSocket();
        currentThreadId.set('thread-continuation');
        planReady.set(true);
        planReadyThread.set('thread-continuation');

        continuePlan();

        expect(socket.sent.map(payload => JSON.parse(payload))).toContainEqual({
            action: 'continue_plan',
            threadId: 'thread-continuation',
            locale: 'en',
        });
        expect(isTyping.get()).toBe(true);

        await vi.advanceTimersByTimeAsync(31_999);
        expect(isTyping.get()).toBe(true);

        await vi.advanceTimersByTimeAsync(1);
        expect(isTyping.get()).toBe(false);
        expect(lastAiError.get()).toMatchObject({
            code: 'response_timeout',
            presented: true,
        });
        expect(mocks.showErrorModal).toHaveBeenCalledWith(
            'Something went wrong',
            'Please try starting the session response again.'
        );
    });

    it('does not time out an Insights response after its first content frame', async () => {
        const start = startInsightsSession('Career fit');
        const socket = await openLatestSocket();
        await start;
        socket.receive({ event: 'insights_ready', threadId: 'thread-insights' });
        socket.receive('Here is what I found.');

        await vi.advanceTimersByTimeAsync(32_000);

        expect(lastAiError.get()).toBeNull();
    });
});
