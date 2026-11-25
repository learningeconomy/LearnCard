import { afterAll, afterEach, beforeEach, expect, test } from 'bun:test';
import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { auth, clearAuth } from '../auth';
import { estimateCosts } from '../../src/admin/cost-model';
import { unavailablePricing } from '../CostEstimate';
import WholeBackfill, { type WholeBackfillRun } from '../WholeBackfill';
const originalFetch = globalThis.fetch;
const previousAct = Object.getOwnPropertyDescriptor(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let view: ReactTestRenderer;
let requests: { path: string; body: any }[];
let props: Parameters<typeof WholeBackfill>[0];
let failStart: boolean;
let delayedStart: ((value: Response) => void) | undefined;
let delay: boolean;
const plan = {
    state: 'review',
    workflowVersion: 2,
    _id: 'plan',
    recordLimit: 300,
    maxGenerationRequests: 300,
    maxEmbeddingRequests: 1500,
    maxPrivacyRequests: 900,
    estimate: estimateCosts(1500, 300, unavailablePricing),
    pricing: unavailablePricing,
};
const run: WholeBackfillRun = {
    _id: 'run',
    state: 'running',
    recordLimit: 300,
    processed: 10,
    written: 8,
    skipped: 2,
    updatedAt: '2026-10-13T23:00:00Z',
    generationRequests: 8,
    embeddingRequests: 40,
    privacyRequests: 24,
    maxGenerationRequests: 300,
    maxEmbeddingRequests: 1500,
    maxPrivacyRequests: 900,
    draining: false,
    resumable: false,
};
const flush = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};
const text = (node: any): string =>
    typeof node === 'string' ? node : (node?.children ?? []).map(text).join('');
const findButton = (label: string) =>
    view.root.findAllByType('button').find(node => text(node) === label)!;
const click = async (label: string) => {
    await act(async () => {
        findButton(label).props.onClick();
    });
};
const mount = async () => {
    await act(async () => {
        view = create(createElement(WholeBackfill, props));
    });
};
const render = async () => {
    await act(async () => {
        view.update(createElement(WholeBackfill, props));
    });
};
const reviewAndAuthorize = async () => {
    await click('Backfill everything');
};
beforeEach(() => {
    auth.set({ did: 'did:web:fixture' });
    requests = [];
    failStart = false;
    delay = false;
    delayedStart = undefined;
    props = {
        fresh: true,
        stale: false,
        csrf: 'fixture',
        enabled: true,
        runs: [],
        refresh: async () => {},
    };
    globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        const body = JSON.parse(String(init?.body));
        requests.push({ path, body });
        expect(init?.method).toBe('POST');
        if (path.endsWith('/plan')) return Response.json(plan);
        if (path === '/admin/embeddings/runs') {
            if (delay)
                return new Promise<Response>(resolve => {
                    delayedStart = resolve;
                });
            if (failStart) throw new TypeError('connection lost');
            return Response.json(run);
        }
        return Response.json({
            ...run,
            state: path.endsWith('/resume')
                ? 'running'
                : path.endsWith('/cancel')
                  ? 'cancelled'
                  : 'paused',
            updatedAt: '2026-10-14T00:00:00Z',
        });
    }) as unknown as typeof fetch;
});
afterEach(async () => {
    await act(async () => {
        view?.unmount();
    });
    globalThis.fetch = originalFetch;
});
afterAll(() => {
    if (previousAct) Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', previousAct);
    else delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});
test('one review and explicit budget authorization start the entire snapshot without manual jobs', async () => {
    await mount();
    await click('Backfill everything');
    expect(findButton('Authorize and start').props.disabled).toBe(false);
    expect(text(view.root)).toContain('300 credentials');
    await click('Authorize and start');
    expect(requests.map(request => request.path)).toEqual([
        '/admin/embeddings/runs/plan',
        '/admin/embeddings/runs',
    ]);
    expect(requests[1].body).toEqual({
        requestId: expect.any(String),
        planId: 'plan',
        paidAuthorized: true,
        generationRetryPolicy: 'transient-v2',
    });
    expect(findButton('Pause backfill')).toBeDefined();
});
test('repeated Start clicks coalesce and uncertain retry reuses the same request ID', async () => {
    await mount();
    await reviewAndAuthorize();
    failStart = true;
    await act(async () => {
        findButton('Authorize and start').props.onClick();
        findButton('Authorize and start').props.onClick();
    });
    expect(requests.filter(request => request.path.endsWith('/runs'))).toHaveLength(1);
    failStart = false;
    await click('Retry same start');
    expect(requests[1].body.requestId).toBe(requests[2].body.requestId);
});
test('refreshes and reopening a running job never dispatch advance or auto-resume', async () => {
    props.runs = [run];
    await mount();
    await render();
    await flush();
    expect(requests).toHaveLength(0);
    expect(findButton('Backfill everything').props.disabled).toBe(true);
    props.fresh = false;
    await render();
    expect(requests).toHaveLength(0);
    expect(findButton('Pause backfill').props.disabled).toBe(false);
});
test('stale polling blocks new work but preserves Pause and Cancel', async () => {
    props.runs = [run];
    props.stale = true;
    await mount();
    expect(findButton('Pause backfill').props.disabled).toBe(false);
    await click('Pause backfill');
    expect(requests[0].path).toBe('/admin/embeddings/runs/run/pause');
    expect(findButton('Cancel backfill').props.disabled).toBe(false);
    await click('Cancel backfill');
    expect(requests[1].path).toBe('/admin/embeddings/runs/run/cancel');
});
test('resume is explicit, preserves budget, and is unavailable while draining', async () => {
    props.runs = [{ ...run, state: 'paused', resumable: true, draining: true }];
    await mount();
    expect(findButton('Resume with remaining budget').props.disabled).toBe(true);
    props.runs = [{ ...run, state: 'paused', resumable: true, draining: false }];
    await render();
    expect(requests).toHaveLength(0);
    await click('Resume with remaining budget');
    expect(requests[0]).toEqual({
        path: '/admin/embeddings/runs/run/resume',
        body: {},
    });
});
test('identity change discards a delayed start result without auto-controls', async () => {
    await mount();
    await reviewAndAuthorize();
    delay = true;
    await click('Authorize and start');
    auth.set({ did: 'did:web:other' });
    await render();
    delayedStart!(Response.json(run));
    await flush();
    expect(view.root.findAllByProps({ 'aria-label': 'Backfill progress' })).toHaveLength(0);
    expect(requests).toHaveLength(2);
});
test('closing confirmation requires preparing a new snapshot', async () => {
    await mount();
    await reviewAndAuthorize();
    const firstId = requests[0].body.requestId;
    await click('Close review');
    await click('Backfill everything');
    expect(findButton('Authorize and start').props.disabled).toBe(false);
    expect(requests[1].body.requestId).not.toBe(firstId);
});

test('expired freshness allows stop-only controls but never resume or new paid work', async () => {
    props.runs = [run];
    props.fresh = false;
    await mount();
    expect(findButton('Backfill everything').props.disabled).toBe(true);
    await click('Pause backfill');
    expect(requests[0].path).toBe('/admin/embeddings/runs/run/pause');
    expect(findButton('Resume with remaining budget').props.disabled).toBe(true);
    await click('Cancel backfill');
    expect(requests[1].path).toBe('/admin/embeddings/runs/run/cancel');
});

test('malformed or unbounded plan cannot open paid authorization', async () => {
    globalThis.fetch = (async () =>
        Response.json({ ...plan, recordLimit: 10001 })) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(view.root.findAllByProps({ type: 'checkbox' })).toHaveLength(0);
    expect(text(view.root)).toContain('review response is incomplete');
});

test('slow review polls one preparation without repeating POST or starting paid work', async () => {
    let resolveStatus!: (response: Response) => void;
    const paths: { path: string; method: string }[] = [];
    globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
        const path = new URL(String(input)).pathname;
        paths.push({ path, method: init?.method ?? 'GET' });
        if (init?.method === 'POST')
            return Response.json(
                { _id: 'prepared', state: 'preparing', processed: 0, total: 300 },
                { status: 202 }
            );
        return new Promise<Response>(resolve => {
            resolveStatus = resolve;
        });
    }) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(text(view.root)).toContain('Preparing your backfill');
    expect(text(view.root)).toContain('No paid backfill has started');
    expect(paths).toEqual([
        { path: '/admin/embeddings/runs/plan', method: 'POST' },
        { path: '/admin/embeddings/runs/plan/prepared', method: 'GET' },
    ]);
    await act(async () => {
        resolveStatus(Response.json({ ...plan, _id: 'prepared' }));
    });
    expect(findButton('Authorize and start').props.disabled).toBe(false);
    expect(paths.filter(path => path.method === 'POST')).toHaveLength(1);
});

test('reload restores saved confirmation by GET only without paid start', async () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const saved = new Map<string, string>();
    Object.assign(globalThis, {
        window: {
            sessionStorage: {
                getItem: (key: string) => saved.get(key) ?? null,
                setItem: (key: string, value: string) => saved.set(key, value),
                removeItem: (key: string) => saved.delete(key),
            },
        },
    });
    let posts = 0,
        gets = 0;
    globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (init?.method === 'POST') {
            posts += 1;
            return Response.json(plan);
        }
        gets += 1;
        return Response.json(plan);
    }) as unknown as typeof fetch;
    try {
        await mount();
        await reviewAndAuthorize();
        await act(async () => {
            view.unmount();
        });
        await mount();
        await flush();
        expect(posts).toBe(1);
        expect(gets).toBe(1);
        expect(findButton('Authorize and start').props.disabled).toBe(false);
    } finally {
        if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
        else delete (globalThis as any).window;
    }
});

test('lost Review response checks saved status and never shows the paid-job warning', async () => {
    let resolveStatus!: (response: Response) => void;
    let posts = 0;
    globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (init?.method === 'POST') {
            posts += 1;
            throw new DOMException('signal timed out', 'TimeoutError');
        }
        return new Promise<Response>(resolve => {
            resolveStatus = resolve;
        });
    }) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(posts).toBe(1);
    expect(text(view.root)).not.toContain('accepted server job may still be running');
    expect(text(view.root)).toContain('no paid backfill was started');
    await act(async () => {
        resolveStatus(Response.json(plan));
    });
    expect(findButton('Authorize and start').props.disabled).toBe(false);
});

test('run selection remains visible and a running lease does not claim a provider request is settling', async () => {
    props.runs = [
        {
            ...run,
            draining: true,
            selection: {
                observedRecords: 5842,
                excludedComplete: 4,
                excludedIneligible: 5538,
                exclusionReasons: { missing_verification: 5538 },
            },
        },
    ];
    await mount();
    expect(text(view.root)).toContain('Selected 300 of 5,842');
    expect(text(view.root)).toContain('Missing verification metadata: 5,538');
    expect(text(view.root)).not.toContain('An in-flight request is settling');
    props.runs = [{ ...props.runs[0], state: 'paused' }];
    await render();
    expect(text(view.root)).toContain('An in-flight request is settling');
});

test('restored review already consumed by a completed run never offers another Start', async () => {
    await mount();
    await click('Backfill everything');
    props.runs = [{ ...run, planId: 'plan', state: 'completed' }];
    await render();
    expect(view.root.findAllByProps({ type: 'checkbox' })).toHaveLength(0);
    expect(text(view.root)).toContain('This review has already been used');
    expect(requests).toHaveLength(1);
});

test('explicit Review rejection is shown without polling or a misleading paid warning', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
        calls += 1;
        return Response.json({ error: 'Review rejected' }, { status: 400 });
    }) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(calls).toBe(1);
    expect(text(view.root)).toContain('Review rejected');
    expect(text(view.root)).not.toContain('accepted server job may still be running');
    expect(findButton('Prepare a new review')).toBeDefined();
});

test('late review status denial cannot log out a new identity', async () => {
    let resolveStatus!: (response: Response) => void;
    globalThis.fetch = (async (_input: URL | RequestInfo, init?: RequestInit) => {
        if (init?.method === 'POST')
            return Response.json({
                _id: 'plan',
                state: 'preparing',
                processed: 0,
                total: 1,
            });
        return new Promise<Response>(resolve => {
            resolveStatus = resolve;
        });
    }) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    auth.set({ did: 'did:web:new-profile' });
    await act(async () => {
        resolveStatus(new Response('denied', { status: 401 }));
    });
    expect(auth.get().did).toBe('did:web:new-profile');
});

test('metadata diagnosis is an explicit read-only action with partial-count warning and no paid authorization', async () => {
    const methods: string[] = [];
    globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
        expect(String(input)).toContain('/metadata-diagnosis');
        methods.push(init?.method ?? 'GET');
        return Response.json({
            scanned: 10000,
            metadataEligible: 1,
            excluded: 9999,
            incomplete: true,
            exclusionReasons: { missing_verification: 9999 },
        });
    }) as unknown as typeof fetch;
    props.fresh = false;
    await mount();
    expect(methods).toHaveLength(0);
    await click('Diagnose excluded metadata');
    expect(methods).toEqual(['GET']);
    expect(text(view.root)).toContain('Missing verification metadata: 9,999');
    expect(text(view.root)).toContain('Incomplete: scan limited');
    expect(view.root.findAllByProps({ type: 'checkbox' })).toHaveLength(0);
});

test('invalid metadata diagnosis cannot crash or hide existing run controls', async () => {
    globalThis.fetch = (async () =>
        Response.json({
            scanned: 'broken',
            excluded: 1,
        })) as unknown as typeof fetch;
    props.runs = [run];
    await mount();
    await click('Diagnose excluded metadata');
    expect(text(view.root)).toContain('Metadata diagnosis returned invalid counts');
    expect(findButton('Pause backfill')).toBeDefined();
    expect(findButton('Cancel backfill')).toBeDefined();
});

test('optional pilot limit is explicit while default snapshots all records', async () => {
    await mount();
    await act(async () => {
        view.root
            .findByProps({ 'aria-label': 'Optional record limit' })
            .props.onChange({ target: { value: '1' } });
    });
    await click('Backfill everything');
    expect(requests[0].body.recordLimit).toBe(1);
    expect(requests).toHaveLength(1);
    expect(text(view.root)).toContain('Verification and safe repair are included');
});

test('end-to-end blocked completion stays explicit and never claims all records backfilled', async () => {
    props.runs = [
        {
            ...run,
            state: 'completed_with_blockers',
            stage: 'finished',
            processed: 300,
            written: 250,
            alreadyComplete: 20,
            blocked: 30,
            blockedReasons: { consent_revoked: 25, generated_provenance_required: 5 },
            reconciled: 300,
        },
    ];
    await mount();
    expect(text(view.root)).toContain('Finished with blocked records');
    expect(text(view.root)).toContain('consent revoked: 25');
    expect(text(view.root)).toContain('generated provenance required: 5');
    expect(findButton('Cancel backfill')).toBeUndefined();
    expect(requests).toHaveLength(0);
});

test('one confirmed start can replace only a visibly drained earlier paused run', async () => {
    props.runs = [{ ...run, state: 'paused', draining: false }];
    await mount();
    await click('Backfill everything');
    expect(text(view.root)).toContain('cancels your paused earlier embeddings-only run');
    await click('Authorize and start');
    expect(requests[1].body.replaceRunId).toBe('run');
});

test('same-DID reauthentication rejects late paid-start success', async () => {
    await mount();
    await reviewAndAuthorize();
    delay = true;
    await click('Authorize and start');
    clearAuth();
    auth.set({ did: 'did:web:fixture' });
    await render();
    delayedStart!(Response.json(run));
    await flush();
    expect(view.root.findAllByProps({ 'aria-label': 'Backfill progress' })).toHaveLength(0);
    expect(requests).toHaveLength(2);
});

test('limited plan clearly states unselected records are outside the run', async () => {
    globalThis.fetch = (async () =>
        Response.json({
            ...plan,
            observedRecords: 5842,
            selectionLimited: true,
        })) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(text(view.root)).toContain('Selected 300 of 5,842');
    expect(text(view.root)).toContain(
        'Test limit applied: unselected records are outside this run'
    );
});

test('bounded large-inventory pilot never reports its sentinel count as an exact total', async () => {
    globalThis.fetch = (async () =>
        Response.json({
            ...plan,
            observedRecords: 10001,
            selectionLimited: true,
            inventoryTruncated: true,
        })) as unknown as typeof fetch;
    await mount();
    await click('Backfill everything');
    expect(text(view.root)).toContain('Selected 300 of at least 10,001');
});

test('v2 start and resume disclose bounded paid retries and explicitly opt in', async () => {
    await mount();
    await click('Backfill everything');
    expect(text(view.root)).toContain('up to 3 automatic retries per record');
    expect(text(view.root)).toContain('confirmed provider request timeouts');
    expect(text(view.root)).toContain('excluding cancellation and caller/stage deadline expiry');
    expect(text(view.root)).toContain('generation requests may charge again');
    await click('Authorize and start');
    expect(requests[1].body.generationRetryPolicy).toBe('transient-v2');
    props.runs = [
        {
            ...run,
            workflowVersion: 2,
            state: 'paused',
            resumable: true,
            updatedAt: new Date(Date.now() + 1000).toISOString(),
        },
    ];
    await render();
    expect(text(view.root)).toContain('used retries are not reset');
    await click('Resume with remaining budget');
    expect(requests.at(-1)?.body).toEqual({ generationRetryPolicy: 'transient-v2' });
});

test('backoff status remains running with Pause and Cancel and never triggers client retries', async () => {
    props.runs = [
        {
            ...run,
            workflowVersion: 2,
            reason: 'Waiting 30 seconds before generation retry 1 of 3.',
        },
    ];
    await mount();
    expect(text(view.root)).toContain('Waiting 30 seconds before generation retry 1 of 3');
    expect(findButton('Pause backfill').props.disabled).toBe(false);
    expect(findButton('Cancel backfill').props.disabled).toBe(false);
    await render();
    expect(requests).toHaveLength(0);
    await click('Pause backfill');
    expect(requests[0].body).toEqual({});
});

test('paused embedding diagnostics render timing/category without starting or resuming work', async () => {
    const { backfillPauseReason } = await import('../../src/admin/backfill-diagnostics');
    const reason = backfillPauseReason({
        version: 1,
        at: '2026-10-14T20:16:48.457Z',
        record: 1525,
        stage: 'embedding',
        code: 'ai_request_timeout',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 1, embedding: 1, privacy: 3 },
        embeddingFailure: {
            elapsedMs: 3001,
            unitRemainingMs: 80000,
            ordinal: 1,
            callerAbortKind: 'none',
            callerAborted: false,
            sdkCategory: 'connection_timeout',
        },
    });
    props.runs = [{ ...run, state: 'paused', resumable: true, reason }];
    await mount();
    expect(text(view.toJSON())).toContain('Embedding 1: connection timeout');
    expect(text(view.toJSON())).toContain(
        '3001 ms elapsed; 80000 ms unit remaining; caller active'
    );
    expect(requests).toHaveLength(0);
});

test('exhausted record requires review, offers no ineffective Resume, and retains Cancel', async () => {
    props.runs = [
        {
            ...run,
            workflowVersion: 2,
            state: 'paused',
            resumable: true,
            resumeBlock: {
                code: 'embedding_attempts_exhausted',
                record: 4296,
                message:
                    'Embedding attempt limit exhausted. Resume cannot add attempts; counters and completed work are preserved.',
            },
        },
    ];
    await mount();
    const displayed = text(view.root);
    expect(displayed).toContain('4296');
    expect(displayed).toContain('Embedding attempt limit exhausted');
    expect(displayed).not.toContain('Resume with remaining budget');
    expect(displayed).not.toContain('Resume enables up to 3');
    expect(requests).toHaveLength(0);
    await render();
    expect(requests).toHaveLength(0);
    await click('Cancel backfill');
    expect(requests.at(-1)?.path).toContain('/cancel');
});

test('historical dispatched evidence is labelled separately and never triggers provider work', async () => {
    props.runs = [
        {
            ...run,
            state: 'paused',
            resumable: false,
            lastDispatchedFailure: {
                version: 1,
                at: '2026-10-15T19:40:00.000Z',
                record: 4296,
                stage: 'embedding',
                code: 'ai_request_timeout',
                dispatchStatus: 'possibly_dispatched',
                requests: { generation: 1, embedding: 7, privacy: 3 },
            },
        },
    ];
    await mount();
    expect(text(view.root)).toContain('Earlier attempt failure with dispatched requests');
    expect(text(view.root)).toContain('Historical evidence for this record');
    expect(text(view.root)).toContain('ai_request_timeout');
    expect(requests).toHaveLength(0);
});

const recoveryRun = (): WholeBackfillRun => ({
    ...run,
    workflowVersion: 2,
    state: 'paused',
    processed: 4295,
    recordLimit: 5000,
    resumable: false,
    resumeBlock: { code: 'embedding_attempts_exhausted', record: 4296, message: 'Review required' },
});
test('supplemental recovery requires two deliberate clicks and sends immutable caps and record once', async () => {
    props.runs = [recoveryRun()];
    await mount();
    expect(requests).toHaveLength(0);
    await click('Review single-use recovery');
    expect(requests).toHaveLength(0);
    expect(text(view.toJSON())).toContain('Authorize paid requests for record 4296 only?');
    await click('Confirm one paid recovery pass');
    expect(requests).toHaveLength(1);
    expect(requests[0].path).toEndWith('/run/recover-once');
    expect(requests[0].body).toMatchObject({
        record: 4296,
        paidAuthorized: true,
        caps: { generation: 1, embedding: 5, privacy: 3 },
    });
});
test('repeated login clears recovery confirmation and interruption never triggers client replay', async () => {
    props.runs = [recoveryRun()];
    await mount();
    await click('Review single-use recovery');
    clearAuth();
    auth.set({ did: 'did:web:fixture' });
    await render();
    expect(findButton('Confirm one paid recovery pass')).toBeUndefined();
    expect(requests).toHaveLength(0);
    props.runs = [
        {
            ...recoveryRun(),
            resumeBlock: {
                code: 'single_recovery_consumed',
                record: 4296,
                message: 'Review required',
            },
            recovery: {
                id: 'claimed',
                record: 4296,
                phase: 'interrupted',
                used: { generation: 1, embedding: 2, privacy: 3 },
                caps: { generation: 1, embedding: 5, privacy: 3 },
                expiresAt: '2026-10-15T21:00:00Z',
            },
        },
    ];
    await render();
    expect(findButton('Review single-use recovery')).toBeUndefined();
    expect(findButton('Resume with remaining budget')).toBeUndefined();
    expect(findButton('Cancel backfill')).toBeDefined();
    expect(requests).toHaveLength(0);
});
test('recovery confirmation is disabled for stale proof, unavailable status or insufficient remaining budget', async () => {
    props.runs = [recoveryRun()];
    props.stale = true;
    await mount();
    expect(findButton('Review single-use recovery').props.disabled).toBe(true);
    props.stale = false;
    props.runs = [{ ...recoveryRun(), embeddingRequests: run.maxEmbeddingRequests }];
    await render();
    expect(findButton('Review single-use recovery').props.disabled).toBe(true);
    expect(requests).toHaveLength(0);
});

test('a historical completed pass does not hide review for a later exhausted record', async () => {
    props.runs = [
        {
            ...recoveryRun(),
            recovery: {
                id: 'previous',
                record: 42,
                phase: 'completed',
                used: { generation: 1, embedding: 5, privacy: 3 },
                caps: { generation: 1, embedding: 5, privacy: 3 },
                expiresAt: '2026-10-15T21:00:00Z',
            },
        },
    ];
    await mount();
    expect(findButton('Review single-use recovery').props.disabled).toBe(false);
    expect(requests).toHaveLength(0);
});
