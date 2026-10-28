import { afterAll, afterEach, beforeEach, expect, mock, test } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement, useSyncExternalStore } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// chat.astro restores the cookie session with refreshAuth() after hydration. The start*
// actions bail at their auth guard and never retry, so ChatInterface must not consume
// the initial topic until a DID is available.

const happyWindow = new Window({ url: 'http://localhost:4321/chat' });
const globals = globalThis as Record<string, unknown>;
const previousGlobals = {
    window: globals.window,
    document: globals.document,
    fetch: globals.fetch,
    IS_REACT_ACT_ENVIRONMENT: globals.IS_REACT_ACT_ENVIRONMENT,
};

globals.window = happyWindow;
globals.document = happyWindow.document;
globals.IS_REACT_ACT_ENVIRONMENT = true;
(happyWindow.HTMLElement.prototype as { scrollIntoView?: () => void }).scrollIntoView = () => {};

const { auth, clearAuth, refreshAuth } = await import('../stores/authStore');

type StartCall = { action: string; args: unknown[]; did: string | null };
const startCalls: StartCall[] = [];
const recordStart =
    (action: string) =>
    async (...args: unknown[]) => {
        // Mirror the real guard: record which DID the action saw when it ran.
        startCalls.push({ action, args, did: auth.get().did });
    };

// bun's module mocks are process-wide, so keep every real chatStore export (other test
// files import it) and replace only the start actions this component triggers.
const realChatStore = await import('../stores/chatStore');
mock.module('../stores/chatStore', () => ({
    ...realChatStore,
    startTopic: recordStart('startTopic'),
    startTopicWithUri: recordStart('startTopicWithUri'),
    startLearningPathway: recordStart('startLearningPathway'),
}));
// The workspace hoists @nanostores/react next to the root React 18 copy, while this app
// renders with its own React 19. Bind useStore to the app's React so hooks share a renderer.
mock.module('@nanostores/react', () => ({
    useStore: <T,>(store: { get: () => T; listen: (listener: () => void) => () => void }) =>
        useSyncExternalStore(
            listener => store.listen(listener),
            () => store.get(),
            () => store.get()
        ),
}));
mock.module('./MessageWithQuestions', () => ({ MessageWithQuestions: () => null }));
mock.module('./ChatInput', () => ({ default: () => null }));
mock.module('./DebugPanel', () => ({ DebugPanel: () => null }));
mock.module('./TypingIndicator', () => ({ default: () => null }));

const { ChatInterface } = await import('./ChatInterface');

let releaseSession: (() => void) | undefined;
let root: Root | undefined;

beforeEach(() => {
    startCalls.length = 0;
    clearAuth();
    globals.fetch = (async () => {
        await new Promise<void>(resolve => {
            releaseSession = resolve;
        });
        return Response.json({ authenticated: true, did: 'did:key:alice' });
    }) as typeof fetch;
});

afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    happyWindow.history.replaceState(null, '', '/chat');
});

afterAll(() => {
    clearAuth();
    for (const [key, value] of Object.entries(previousGlobals)) globals[key] = value;
});

const render = async (props: { initialTopic?: string; initialTopicUri?: string }) => {
    const container = happyWindow.document.createElement('div');
    happyWindow.document.body.appendChild(container);
    root = createRoot(container as unknown as Element);
    await act(async () => {
        root!.render(createElement(ChatInterface, { initialMessages: [], ...props }));
    });
};

const restoreSessionAfterRender = async () => {
    const restored = refreshAuth();
    await act(async () => {
        await Promise.resolve();
    });
    expect(startCalls).toEqual([]);

    await act(async () => {
        releaseSession?.();
        await restored;
    });
};

test('waits for a delayed cookie session before starting the initial topic', async () => {
    await render({ initialTopic: 'Photosynthesis' });

    expect(startCalls).toEqual([]);

    await restoreSessionAfterRender();

    expect(startCalls).toEqual([
        { action: 'startTopic', args: ['Photosynthesis'], did: 'did:key:alice' },
    ]);
});

test('waits for a delayed cookie session before starting a topic URI', async () => {
    await render({ initialTopicUri: 'lc:topic:1' });
    await restoreSessionAfterRender();

    expect(startCalls).toEqual([
        { action: 'startTopicWithUri', args: ['lc:topic:1'], did: 'did:key:alice' },
    ]);
});

test('waits for a delayed cookie session before starting a learning pathway', async () => {
    happyWindow.history.replaceState(null, '', '/chat?pathwayUri=lc%3Apathway%3A1');

    await render({ initialTopicUri: 'lc:topic:1' });
    await restoreSessionAfterRender();

    expect(startCalls).toEqual([
        {
            action: 'startLearningPathway',
            args: ['lc:topic:1', 'lc:pathway:1'],
            did: 'did:key:alice',
        },
    ]);
});
