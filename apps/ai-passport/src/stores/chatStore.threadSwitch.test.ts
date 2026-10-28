import type { ChatMessage } from '@learncard/types';
import { afterAll, beforeEach, expect, test } from 'bun:test';

import { clearAuth, refreshAuth } from './authStore';
import {
    connectWebSocket,
    currentThreadId,
    disconnectWebSocket,
    isTyping,
    loadThread,
    messages,
    sendMessageWithQuestion,
} from './chatStore';

const originalFetch = globalThis.fetch;
const originalWebSocket = globalThis.WebSocket;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

// chatStore mirrors the selected thread into the page URL.
Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
        location: { href: 'http://localhost/chat' },
        history: { replaceState: () => {} },
    },
});

class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    static created = Promise.withResolvers<FakeWebSocket>();

    readonly protocol = 'ai-passport';
    readyState = FakeWebSocket.CONNECTING;
    readonly sent: unknown[] = [];
    readonly messageListeners: Array<(event: MessageEvent) => void> = [];

    constructor(
        readonly url: string | URL,
        readonly protocols?: string | string[]
    ) {
        FakeWebSocket.created.resolve(this);
    }

    addEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') this.messageListeners.push(listener);
    }

    send(payload: string): void {
        this.sent.push(JSON.parse(payload));
    }

    receive(payload: unknown): void {
        const event = new MessageEvent('message', { data: JSON.stringify(payload) });
        this.messageListeners.forEach(listener => listener(event));
    }

    close(): void {
        this.readyState = FakeWebSocket.CLOSED;
    }
}

const threadMessages: Record<string, ChatMessage[]> = {
    'thread-a': [],
    'thread-b': [
        { role: 'user', content: 'What is a fraction?' },
        { role: 'assistant', content: 'A part of a whole.' },
    ],
    'thread-c': [{ role: 'user', content: 'Thread C' }],
};
const messageGates = new Map<string, Promise<void>>();

globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);

    if (url.pathname === '/auth/session') {
        return Response.json({ authenticated: true, did: 'did:key:alice' });
    }

    if (url.pathname === '/auth/websocket-ticket') {
        return Response.json({ ticket: 'a'.repeat(43) });
    }

    if (url.pathname === '/threads') {
        return Response.json(
            Object.keys(threadMessages).map(id => ({
                id,
                did: 'did:key:alice',
                title: id,
                created_at: '2026-10-27T00:00:00.000Z',
                last_message_at: '2026-10-27T00:00:00.000Z',
            }))
        );
    }

    if (url.pathname === '/messages') {
        const threadId = url.searchParams.get('threadId') ?? '';

        await messageGates.get(threadId);

        return Response.json(threadMessages[threadId]);
    }

    if (url.pathname === '/thread_credentials') return Response.json([]);

    return Response.json({});
}) as typeof fetch;

afterAll(() => {
    disconnectWebSocket();
    clearAuth();
    globalThis.fetch = originalFetch;
    globalThis.WebSocket = originalWebSocket;
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
});

beforeEach(() => {
    messageGates.clear();
});

const openSocket = async (): Promise<FakeWebSocket> => {
    disconnectWebSocket();
    FakeWebSocket.created = Promise.withResolvers<FakeWebSocket>();
    await refreshAuth();
    connectWebSocket();

    const socket = await FakeWebSocket.created.promise;

    socket.readyState = FakeWebSocket.OPEN;

    return socket;
};

test('drops the old stream when the learner switches threads mid-response', async () => {
    const socket = await openSocket();

    await loadThread('thread-a');
    sendMessageWithQuestion('Explain photosynthesis');
    socket.receive('Plants turn ');

    expect(socket.sent).toEqual([
        {
            message: { role: 'user', content: 'Explain photosynthesis' },
            threadId: 'thread-a',
        },
    ]);
    expect(messages.get().at(-1)).toEqual({ role: 'assistant', content: 'Plants turn ' });

    await loadThread('thread-b');

    socket.receive('light into sugar.');
    socket.receive({ done: true, threadId: 'thread-a' });

    expect(currentThreadId.get()).toBe('thread-b');
    expect(messages.get()).toEqual(threadMessages['thread-b']);
    expect(isTyping.get()).toBe(false);

    sendMessageWithQuestion('And a decimal?');
    socket.receive('Another way to write one.');
    socket.receive({ done: true, threadId: 'thread-b' });

    expect(currentThreadId.get()).toBe('thread-b');
    expect(messages.get().slice(-2)).toEqual([
        { role: 'user', content: 'And a decimal?' },
        { role: 'assistant', content: 'Another way to write one.' },
    ]);
});

test('keeps the newest selection when thread loads finish out of order', async () => {
    await openSocket();

    const slowThreadB = Promise.withResolvers<void>();

    messageGates.set('thread-b', slowThreadB.promise);

    const loadingB = loadThread('thread-b');
    await loadThread('thread-c');
    slowThreadB.resolve();
    await loadingB;

    expect(currentThreadId.get()).toBe('thread-c');
    expect(messages.get()).toEqual(threadMessages['thread-c']);
});
