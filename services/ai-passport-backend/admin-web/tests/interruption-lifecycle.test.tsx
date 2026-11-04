import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';
import { auth, clearAuth, getDid, logout, refreshAuth } from '../auth';
import type { BatchStatus } from '../BatchControls';

// Exercise the actual React effects, auth reads and polling paths. Every fetch is
// intercepted, including unexpected paths; no provider or external service runs.
const savedGlobals = new Map(
    ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT'].map(key => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
    ])
);
const browser = Object.assign(new EventTarget(), {
    location: new URL('http://localhost/admin'),
});
const page = Object.assign(new EventTarget(), { hidden: false });
Object.assign(globalThis, { window: browser, document: page, IS_REACT_ACT_ENVIRONMENT: true });
const { default: AdminDashboard } = await import('../AdminDashboard');
const { default: BatchControls } = await import('../BatchControls');

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
let timerId = 0;
const timers = new Map<number, { delay: number; fire: () => void }>();
let view: ReactTestRenderer | undefined;

type PendingAdvance = {
    signal: AbortSignal;
    body: { sequence: number };
    resolve: (response: Response) => void;
};
const fixtureDid = 'did:web:lifecycle-fixture';
const makeBatch = (overrides: Partial<BatchStatus> = {}): BatchStatus => ({
    _id: 'batch-fixture',
    jobId: 'repair-fixture',
    kind: 'verification',
    limit: 5,
    state: 'running',
    processed: 0,
    sequence: 0,
    ...overrides,
});
const makeStatus = () => ({
    generation: 'openai1536',
    target: 'nova1024v1',
    enabled: true,
    dualWrite: true,
    fresh: true,
    csrf: 'fixture-csrf',
    jobs: [],
    repairJobs: [
        {
            _id: 'repair-fixture',
            state: 'paused',
            scanned: 0,
            repaired: 0,
            awaitingVerification: false,
            outcomes: {},
        },
    ],
    batches: [] as BatchStatus[],
});
const coverage = {
    observedAt: '2026-10-13T00:00:00.000Z',
    complete: true,
    totalRecords: 10,
    observedRecords: 10,
    inventoryLimit: 100,
    novaReady: 2,
    openaiOnly: 7,
    unresolved: 1,
    rollbackCopies: 2,
};

type ReadMode = 'ok' | '503' | 'network' | 'malformed' | 'hang' | 401 | 403;
let status: ReturnType<typeof makeStatus>;
let sessionDid: string;
let sessionMode: ReadMode;
let statusMode: ReadMode;
let coverageMode: ReadMode;
let advances: PendingAdvance[];
let requests: { path: string; method: string; signal?: AbortSignal | null }[];
let unexpectedRequests: string[];
let coverageSignals: AbortSignal[];
let delayStart: boolean;
let resolveStart: ((response: Response) => void) | undefined;

function readResponse(mode: ReadMode, value: object): Promise<Response> {
    if (mode === 'hang') return new Promise(() => {});
    if (mode === 'network') return Promise.reject(new TypeError('fixture network interruption'));
    if (mode === 'malformed') return Promise.resolve(new Response('not JSON'));
    if (mode === 401 || mode === 403)
        return Promise.resolve(new Response('denied', { status: mode }));
    if (mode === '503')
        return Promise.resolve(
            Response.json({ reason: 'fixture read unavailable' }, { status: 503 })
        );
    return Promise.resolve(Response.json(value));
}

beforeEach(() => {
    clearAuth();
    auth.set({ did: fixtureDid });
    page.hidden = false;
    status = makeStatus();
    sessionDid = fixtureDid;
    sessionMode = statusMode = coverageMode = 'ok';
    advances = [];
    requests = [];
    unexpectedRequests = [];
    coverageSignals = [];
    delayStart = false;
    resolveStart = undefined;
    timers.clear();
    globalThis.setTimeout = ((callback: (...args: any[]) => void, delay = 0, ...args: any[]) => {
        timerId += 1;
        const id = timerId;
        timers.set(id, { delay, fire: () => callback(...args) });
        return id;
    }) as unknown as typeof setTimeout;
    globalThis.clearTimeout = ((id: number) => {
        timers.delete(id);
    }) as unknown as typeof clearTimeout;
    globalThis.fetch = Object.assign(
        (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
            const path = new URL(url instanceof Request ? url.url : url.toString()).pathname;
            const method = init?.method ?? 'GET';
            requests.push({ path, method, signal: init?.signal });
            if (path === '/auth/session')
                return readResponse(sessionMode, { authenticated: true, did: sessionDid });
            if (path === '/auth/logout') return Promise.resolve(Response.json({ ok: true }));
            if (path === '/admin/embeddings') return readResponse(statusMode, status);
            if (path === '/admin/embeddings/coverage') {
                coverageSignals.push(init!.signal!);
                return readResponse(coverageMode, coverage);
            }
            if (path === '/admin/embeddings/batches' && method === 'POST') {
                const body = JSON.parse(String(init?.body));
                expect(body.kind).toBe('verification');
                expect(body.jobId).toBe('repair-fixture');
                expect(body.paidAuthorized).toBe(false);
                expect(new Headers(init?.headers).get('X-Passport-CSRF')).toBe('fixture-csrf');
                if (delayStart)
                    return new Promise(resolve => {
                        resolveStart = resolve;
                    });
                status.batches = [makeBatch()];
                return Promise.resolve(Response.json(status.batches[0]));
            }
            if (path === '/admin/embeddings/batches/batch-fixture/advance' && method === 'POST') {
                // Intentionally ignore abort: late transport responses must be fenced by
                // the component lifecycle, not merely by a cooperative fetch mock.
                return new Promise(resolve =>
                    advances.push({
                        signal: init!.signal!,
                        body: JSON.parse(String(init?.body)),
                        resolve,
                    })
                );
            }
            if (
                /^\/admin\/embeddings\/batches\/batch-fixture\/(pause|cancel)$/.test(path) &&
                method === 'POST'
            ) {
                status.batches = [
                    makeBatch({ state: path.endsWith('/cancel') ? 'cancelled' : 'paused' }),
                ];
                return Promise.resolve(Response.json(status.batches[0]));
            }
            unexpectedRequests.push(`${method} ${path}`);
            return Promise.reject(new Error(`Unexpected mocked request: ${method} ${path}`));
        },
        { preconnect: originalFetch.preconnect }
    );
});

afterEach(async () => {
    await act(async () => {
        view?.unmount();
    });
    view = undefined;
    clearAuth();
    globalThis.fetch = originalFetch;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    timers.clear();
    expect(unexpectedRequests).toEqual([]);
});

afterAll(() => {
    for (const [key, descriptor] of savedGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

const textOf = (node: ReactTestInstance | string): string =>
    typeof node === 'string' ? node : node.children.map(textOf).join('');
const button = (name: string) =>
    view!.root
        .findAllByType('button')
        .find(node => node.props['aria-label'] === name || textOf(node) === name)!;
const batchComponent = () => view!.root.findByType(BatchControls);
const startCount = () => requests.filter(({ path }) => path === '/admin/embeddings/batches').length;
const advanceTimers = () => [...timers.values()].filter(({ delay }) => delay === 500);

async function fireTimers(delay: number) {
    const due = [...timers.entries()].filter(([, timer]) => timer.delay === delay);
    await act(async () => {
        for (const [id, timer] of due) {
            if (timers.delete(id)) timer.fire();
        }
    });
}
async function mount() {
    await act(async () => {
        view = create(createElement(AdminDashboard));
    });
    expect(view!.root.findAllByType(BatchControls)).toHaveLength(1);
    await act(async () => {
        batchComponent()
            .findAllByType('select')[1]!
            .props.onChange({ target: { value: 'repair-fixture' } });
    });
}
async function refresh() {
    await act(async () => {
        button('Refresh').props.onClick();
    });
}
async function startAdvance() {
    await mount();
    expect(button('Start bounded verification').props.disabled).toBe(false);
    await act(async () => {
        button('Start bounded verification').props.onClick();
    });
    expect(startCount()).toBe(1);
    await fireTimers(500);
    expect(advances).toHaveLength(1);
    expect(advances[0]!.signal.aborted).toBe(false);
    expect(advances[0]!.body.sequence).toBe(0);
    return advances[0]!;
}
async function finishAdvance(pending: PendingAdvance, state = 'running', sequence = 1) {
    const result = makeBatch({ state, sequence, processed: sequence });
    status.batches = [result];
    await act(async () => {
        pending.resolve(Response.json(result));
    });
}
async function assertStoppedEvenAfterLateReply(pending: PendingAdvance) {
    expect(pending.signal.aborted).toBe(true);
    const readsBeforeReply = requests.filter(({ method }) => method === 'GET').length;
    await finishAdvance(pending);
    expect(requests.filter(({ method }) => method === 'GET')).toHaveLength(readsBeforeReply);
    expect(advanceTimers()).toHaveLength(0);
    await fireTimers(500);
    expect(advances).toHaveLength(1);
}

describe('real dashboard and bounded-batch interruption lifecycle', () => {
    for (const failure of ['503', 'network', 'malformed'] as const) {
        test(`status ${failure} keeps the mounted advance alive and continuing`, async () => {
            const pending = await startAdvance();
            const mounted = batchComponent();
            statusMode = failure;
            await refresh();
            expect(batchComponent()).toBe(mounted);
            expect(batchComponent().props.stale).toBe(true);
            expect(getDid()).toBe(fixtureDid);
            expect(pending.signal.aborted).toBe(false);
            expect(textOf(view!.root)).toContain('Status update delayed');
            await finishAdvance(pending);
            expect(batchComponent().props.stale).toBe(true);
            await fireTimers(500);
            expect(advances).toHaveLength(2);
            expect(advances[1]!.body.sequence).toBe(1);
            expect(advances[1]!.signal.aborted).toBe(false);
        });
    }

    test('auth-session 503 preserves identity and the in-flight controller', async () => {
        const pending = await startAdvance();
        const mounted = batchComponent();
        sessionMode = '503';
        await refresh();
        expect(getDid()).toBe(fixtureDid);
        expect(batchComponent()).toBe(mounted);
        expect(batchComponent().props.stale).toBe(true);
        expect(pending.signal.aborted).toBe(false);
        await finishAdvance(pending);
        await fireTimers(500);
        expect(advances).toHaveLength(2);
    });

    for (const failure of ['503', 'network', 'malformed', 'hang'] as const) {
        test(`coverage ${failure} cannot cancel the active advance or stale good status`, async () => {
            const pending = await startAdvance();
            const mounted = batchComponent();
            coverageMode = failure;
            await refresh();
            expect(batchComponent()).toBe(mounted);
            expect(batchComponent().props.stale).toBe(false);
            expect(pending.signal.aborted).toBe(false);
            if (failure === 'hang') {
                expect(coverageSignals.at(-1)!.aborted).toBe(false);
                await fireTimers(20000);
                expect(coverageSignals.at(-1)!.aborted).toBe(true);
                expect(pending.signal.aborted).toBe(false);
                expect(textOf(view!.root)).toContain('Read timed out');
            }
            await finishAdvance(pending);
            await fireTimers(500);
            expect(advances).toHaveLength(2);
        });
    }

    test('stale status blocks both a new start and metadata preview until a successful refresh', async () => {
        await mount();
        statusMode = '503';
        await refresh();
        expect(button('Start bounded verification').props.disabled).toBe(true);
        expect(button('Preview aggregate metadata').props.disabled).toBe(true);
        expect(button('Create dry-run').props.disabled).toBe(true);
        await act(async () => {
            // Invoke handlers as well as checking disabled UI: their guards must hold.
            button('Start bounded verification').props.onClick();
            button('Preview aggregate metadata').props.onClick();
            button('Create dry-run').props.onClick();
        });
        expect(requests.filter(({ method }) => method === 'POST')).toHaveLength(0);
        statusMode = 'ok';
        await refresh();
        expect(button('Start bounded verification').props.disabled).toBe(false);
        expect(button('Preview aggregate metadata').props.disabled).toBe(false);
        await act(async () => {
            button('Start bounded verification').props.onClick();
        });
        expect(startCount()).toBe(1);
    });

    test('fresh:false aborts immediately despite hung coverage and fresh:true never auto-resumes', async () => {
        const pending = await startAdvance();
        coverageMode = 'hang';
        await refresh();
        const hungCoverage = coverageSignals.at(-1)!;
        status.fresh = false;
        await refresh();
        expect(hungCoverage.aborted).toBe(false);
        expect(batchComponent().props.fresh).toBe(false);
        await assertStoppedEvenAfterLateReply(pending);
        status.fresh = true;
        await refresh();
        await fireTimers(500);
        expect(advances).toHaveLength(1);
        expect(button('Start bounded verification').props.disabled).toBe(false);
    });

    test('explicit logout unmounts controls and rejects a late running response', async () => {
        const pending = await startAdvance();
        await act(async () => {
            await logout();
        });
        expect(getDid()).toBeNull();
        expect(view!.root.findAllByType(BatchControls)).toHaveLength(0);
        await assertStoppedEvenAfterLateReply(pending);
    });

    test('a session identity change stops the old batch before publishing the new identity', async () => {
        const pending = await startAdvance();
        sessionDid = 'did:web:another-fixture';
        await refresh();
        expect(getDid()).toBe(sessionDid);
        await assertStoppedEvenAfterLateReply(pending);
        await fireTimers(0);
        await fireTimers(500);
        expect(advances).toHaveLength(1);
        expect(view!.root.findAllByType(BatchControls)).toHaveLength(1);
    });

    for (const source of ['session', 'status', 'coverage'] as const) {
        for (const denial of [401, 403] as const) {
            test(`${source} ${denial} clears access and stops even a late successful advance`, async () => {
                const pending = await startAdvance();
                if (source === 'session') sessionMode = denial;
                if (source === 'status') statusMode = denial;
                if (source === 'coverage') coverageMode = denial;
                await refresh();
                expect(getDid()).toBeNull();
                expect(view!.root.findAllByType(BatchControls)).toHaveLength(0);
                await assertStoppedEvenAfterLateReply(pending);
            });
        }
    }

    for (const stop of ['batch cancelled', 'job cancelled', 'job completed'] as const) {
        test(`fresh remote ${stop} stops the active controller`, async () => {
            const pending = await startAdvance();
            if (stop === 'batch cancelled') status.batches = [makeBatch({ state: 'cancelled' })];
            else status.repairJobs[0]!.state = stop === 'job cancelled' ? 'cancelled' : 'completed';
            await refresh();
            expect(textOf(view!.root)).toContain('Batch stopped on the server');
            await assertStoppedEvenAfterLateReply(pending);
        });
    }

    test('an older non-running batch snapshot does not cancel a newer advance', async () => {
        const first = await startAdvance();
        await finishAdvance(first);
        await fireTimers(500);
        const second = advances[1]!;
        status.batches = [makeBatch({ state: 'paused', sequence: 0 })];
        await refresh();
        expect(second.signal.aborted).toBe(false);
        expect(advances).toHaveLength(2);
    });

    for (const event of ['visibilitychange', 'pagehide'] as const) {
        test(`${event} aborts the advance and returning to the page never revives it`, async () => {
            const pending = await startAdvance();
            await act(async () => {
                if (event === 'visibilitychange') {
                    page.hidden = true;
                    page.dispatchEvent(new Event(event));
                } else browser.dispatchEvent(new Event(event));
            });
            await assertStoppedEvenAfterLateReply(pending);
            await act(async () => {
                page.hidden = false;
                page.dispatchEvent(new Event('visibilitychange'));
            });
            await refresh();
            await fireTimers(500);
            expect(advances).toHaveLength(1);
            expect(startCount()).toBe(1);
        });
    }

    for (const action of ['Pause batch', 'Cancel batch'] as const) {
        test(`${action} remains available while status is stale and fences late responses`, async () => {
            const pending = await startAdvance();
            statusMode = '503';
            await refresh();
            expect(button(action).props.disabled).toBe(false);
            await act(async () => {
                button(action).props.onClick();
            });
            await assertStoppedEvenAfterLateReply(pending);
        });
    }

    for (const action of ['Pause batch', 'Cancel batch'] as const) {
        test(`${action} is available when the first refresh after start fails`, async () => {
            await mount();
            expect(batchComponent().props.batches).toHaveLength(0);
            statusMode = '503';
            await act(async () => {
                button('Start bounded verification').props.onClick();
            });
            expect(batchComponent().props.batches).toHaveLength(0);
            expect(batchComponent().props.stale).toBe(true);
            expect(button(action)).toBeDefined();
            expect(button(action).props.disabled).toBe(false);
            await fireTimers(500);
            expect(advances).toHaveLength(1);
            await act(async () => {
                button(action).props.onClick();
            });
            await assertStoppedEvenAfterLateReply(advances[0]!);
        });
    }

    for (const denial of [401, 403] as const) {
        test(`late start ${denial} from a prior session cannot clear a newer same-DID login`, async () => {
            await mount();
            delayStart = true;
            await act(async () => {
                button('Start bounded verification').props.onClick();
            });
            expect(resolveStart).toBeDefined();
            await act(async () => {
                clearAuth();
            });
            expect(getDid()).toBeNull();
            await act(async () => {
                await refreshAuth();
            });
            await fireTimers(0);
            expect(getDid()).toBe(fixtureDid);
            expect(view!.root.findAllByType(BatchControls)).toHaveLength(1);
            await act(async () => {
                resolveStart!(new Response('old session denied', { status: denial }));
            });
            expect(getDid()).toBe(fixtureDid);
            expect(view!.root.findAllByType(BatchControls)).toHaveLength(1);
            await fireTimers(500);
            expect(advances).toHaveLength(0);
        });
    }

    test('unmount aborts the advance and no late completion schedules more work', async () => {
        const pending = await startAdvance();
        await act(async () => {
            view!.unmount();
        });
        view = undefined;
        await assertStoppedEvenAfterLateReply(pending);
        expect(timers.size).toBe(0);
    });
});

test('primary dashboard exposes coverage and one workflow while legacy tools start collapsed', async () => {
    await mount();
    const primary = button('Backfill everything');
    expect(primary).toBeDefined();
    expect(view!.root.findAllByType('svg')).toHaveLength(1);
    const hasClosedDetailsAncestor = (node: ReactTestInstance) => {
        for (let parent = node.parent; parent; parent = parent.parent) {
            if (parent.type === 'details' && !parent.props.open) return true;
        }
        return false;
    };
    expect(hasClosedDetailsAncestor(primary)).toBe(false);
    for (const label of [
        'Create dry-run',
        'Create apply job',
        'Create verify-only range',
        'Start bounded verification',
        'Preview aggregate metadata',
        'Diagnose excluded metadata',
    ])
        expect(hasClosedDetailsAncestor(button(label))).toBe(true);
    expect(requests.some(request => request.method === 'POST')).toBe(false);
});
