import { afterAll, expect, test } from 'bun:test';

import { clearAuth, refreshAuth } from './authStore';
import {
    connectWebSocket,
    disconnectWebSocket,
    credentialPreloadUnavailable,
    isLoading,
    isTyping,
    onReady,
    sendMessageWithQuestion,
} from './chatStore';

const originalFetch = globalThis.fetch;
const originalWebSocket = globalThis.WebSocket;
let socketCreated = Promise.withResolvers<FakeWebSocket>();
let ticketRequests = 0;
let ticketStatus = 200;

class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    readonly protocol = 'ai-passport';
    readyState = FakeWebSocket.CONNECTING;
    closeCalls = 0;
    readonly messageListeners: Array<(event: MessageEvent) => void> = [];

    constructor(
        readonly url: string | URL,
        readonly protocols?: string | string[]
    ) {
        socketCreated.resolve(this);
    }

    addEventListener(type: string, listener: (event: MessageEvent) => void): void {
        if (type === 'message') this.messageListeners.push(listener);
    }

    receive(payload: unknown): void {
        const event = new MessageEvent('message', { data: JSON.stringify(payload) });
        this.messageListeners.forEach(listener => listener(event));
    }

    close(): void {
        this.closeCalls += 1;
        this.readyState = FakeWebSocket.CLOSED;
    }
}

globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
globalThis.fetch = ((input: Parameters<typeof fetch>[0]) => {
    const path = new URL(typeof input === 'string' || input instanceof URL ? input : input.url)
        .pathname;

    if (path === '/auth/session') {
        return Promise.resolve(Response.json({ authenticated: true, did: 'did:key:alice' }));
    }

    if (path === '/auth/websocket-ticket') {
        ticketRequests += 1;

        return Promise.resolve(
            Response.json(ticketStatus === 200 ? { ticket: 'a'.repeat(43) } : {}, {
                status: ticketStatus,
            })
        );
    }

    return Promise.resolve(Response.json({ authenticated: true }));
}) as typeof fetch;

afterAll(() => {
    globalThis.fetch = originalFetch;
    globalThis.WebSocket = originalWebSocket;
});

test('closes an authenticated socket when the identity is cleared', async () => {
    await refreshAuth();
    connectWebSocket();

    const socket = await socketCreated.promise;

    clearAuth();

    expect(socket.closeCalls).toBe(1);
});

test('cancels a pending socket continuation on disconnect', () => {
    let cancellation: Error | undefined;

    onReady(
        () => {},
        error => {
            cancellation = error;
        }
    );
    disconnectWebSocket();

    expect(cancellation?.message).toBe('WebSocket connection cancelled');
});

test('does not retry ticket minting after a message connection fails', async () => {
    ticketRequests = 0;
    ticketStatus = 401;

    await refreshAuth();
    sendMessageWithQuestion('hello');
    await Bun.sleep(250);

    expect(ticketRequests).toBe(1);

    clearAuth();
});

test('shows preload warnings without stopping chat and rejects old socket warnings', async () => {
    ticketStatus = 200;
    await refreshAuth();
    socketCreated = Promise.withResolvers<FakeWebSocket>();
    connectWebSocket();
    const first = await socketCreated.promise;
    isLoading.set(true);
    isTyping.set(true);
    first.receive({ event: 'credential_preload_error' });
    expect(credentialPreloadUnavailable.get()).toBe(true);
    expect(isLoading.get()).toBe(true);
    expect(isTyping.get()).toBe(true);
    first.receive({ event: 'credentials_ready', suggestedTopics: ['Fractions'] });
    expect(credentialPreloadUnavailable.get()).toBe(false);
    expect(isLoading.get()).toBe(true);
    expect(isTyping.get()).toBe(true);

    disconnectWebSocket();
    socketCreated = Promise.withResolvers<FakeWebSocket>();
    connectWebSocket();
    const second = await socketCreated.promise;
    first.receive({ event: 'credential_preload_error' });
    expect(credentialPreloadUnavailable.get()).toBe(false);
    second.receive({ event: 'credential_preload_error' });
    expect(credentialPreloadUnavailable.get()).toBe(true);
    clearAuth();
    expect(credentialPreloadUnavailable.get()).toBe(false);
});
