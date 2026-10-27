import { expect, mock, test } from 'bun:test';
const { refreshAuth, clearAuth, getDid } = await import('../../admin-web/auth');
test('logout aborts session refresh and a late response cannot restore the old principal', async () => {
    const original = globalThis.fetch;
    let resolve!: (response: Response) => void, signal: AbortSignal | undefined;
    globalThis.fetch = Object.assign(
        mock((_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
            signal = init?.signal ?? undefined;
            return new Promise<Response>(r => (resolve = r));
        }),
        { preconnect: original.preconnect }
    );
    try {
        const pending = refreshAuth();
        clearAuth();
        expect(signal?.aborted).toBe(true);
        resolve(Response.json({ authenticated: true, did: 'did:web:old' }));
        expect(await pending).toBe(false);
        expect(getDid()).toBeNull();
    } finally {
        globalThis.fetch = original;
        clearAuth();
    }
});
test('an unmounted caller can cancel its wait without cancelling a shared session reader', async () => {
    const original = globalThis.fetch;
    let resolve!: (response: Response) => void;
    globalThis.fetch = Object.assign(
        mock(() => new Promise<Response>(r => (resolve = r))),
        { preconnect: original.preconnect }
    );
    try {
        const controller = new AbortController();
        const owned = refreshAuth(controller.signal),
            shared = refreshAuth();
        controller.abort(new Error('unmounted'));
        await expect(owned).rejects.toThrow('unmounted');
        resolve(Response.json({ authenticated: true, did: 'did:web:new' }));
        expect(await shared).toBe(true);
        expect(getDid()).toBe('did:web:new');
    } finally {
        globalThis.fetch = original;
        clearAuth();
    }
});

test('temporary session failures preserve the last identity and bearer token', async () => {
    const original = globalThis.fetch;
    const { authenticatedFetch } = await import('../../admin-web/auth');
    let failure: Response | Error | null = null;
    let authorization: string | null = null;
    globalThis.fetch = Object.assign(
        mock(async (_url: any, init?: RequestInit) => {
            authorization = new Headers(init?.headers).get('Authorization');
            if (failure instanceof Error) throw failure;
            return (
                failure ??
                Response.json({
                    authenticated: true,
                    did: 'did:web:kept',
                    token: 'synthetic-token',
                })
            );
        }),
        { preconnect: original.preconnect }
    );
    try {
        expect(await refreshAuth()).toBe(true);
        for (const next of [
            new Response('unavailable', { status: 503 }),
            new Error('offline'),
            Response.json({ authenticated: true }),
            new Response('broken json'),
        ]) {
            failure = next;
            await expect(refreshAuth()).rejects.toThrow();
            expect(getDid()).toBe('did:web:kept');
            failure = null;
            await authenticatedFetch('/read-only-fixture');
            expect(authorization as string | null).toBe('Bearer synthetic-token');
        }
    } finally {
        globalThis.fetch = original;
        clearAuth();
    }
});

for (const denied of [
    new Response('not JSON', { status: 401 }),
    new Response('forbidden', { status: 403 }),
    Response.json({ authenticated: false, did: 'did:web:must-not-survive' }),
]) {
    test(`authoritative session denial clears identity (${denied.status}, ${denied.statusText})`, async () => {
        const original = globalThis.fetch;
        let response = Response.json({ authenticated: true, did: 'did:web:old' });
        globalThis.fetch = Object.assign(
            mock(async () => response),
            { preconnect: original.preconnect }
        );
        try {
            await refreshAuth();
            response = denied;
            expect(await refreshAuth()).toBe(false);
            expect(getDid()).toBeNull();
        } finally {
            globalThis.fetch = original;
            clearAuth();
        }
    });
}

test('a hung shared refresh times out, retains identity, and releases single-flight for a new read', async () => {
    const originalFetch = globalThis.fetch,
        originalTimer = globalThis.setTimeout;
    let mode = 'good',
        late!: (value: Response) => void,
        requestSignal: AbortSignal | undefined;
    globalThis.fetch = Object.assign(
        mock(async (_url: any, init?: RequestInit) => {
            if (mode === 'good') return Response.json({ authenticated: true, did: 'did:web:kept' });
            requestSignal = init?.signal ?? undefined;
            return new Promise<Response>(resolve => {
                late = resolve;
            });
        }),
        { preconnect: originalFetch.preconnect }
    );
    globalThis.setTimeout = ((fn: any, ms?: number, ...args: any[]) =>
        originalTimer(fn, ms === 20000 ? 5 : ms, ...args)) as typeof setTimeout;
    try {
        await refreshAuth();
        mode = 'hang';
        await expect(refreshAuth()).rejects.toThrow('Read timed out');
        expect(requestSignal?.aborted).toBe(true);
        expect(getDid()).toBe('did:web:kept');
        mode = 'good';
        expect(await refreshAuth()).toBe(true);
        late(Response.json({ authenticated: true, did: 'did:web:too-late' }));
        await new Promise(resolve => originalTimer(resolve, 0));
        expect(getDid()).toBe('did:web:kept');
    } finally {
        globalThis.fetch = originalFetch;
        globalThis.setTimeout = originalTimer;
        clearAuth();
    }
});

test('logout releases an uncooperative old refresh without letting it clear a newer refresh', async () => {
    const original = globalThis.fetch;
    const responses: ((value: Response) => void)[] = [];
    globalThis.fetch = Object.assign(
        mock(() => new Promise<Response>(resolve => responses.push(resolve))),
        { preconnect: original.preconnect }
    );
    try {
        const old = refreshAuth();
        clearAuth();
        const current = refreshAuth();
        expect(responses).toHaveLength(2);
        expect(await old).toBe(false);
        const shared = refreshAuth();
        expect(responses).toHaveLength(2);
        responses[0]!(Response.json({ authenticated: true, did: 'did:web:old' }));
        responses[1]!(Response.json({ authenticated: true, did: 'did:web:new' }));
        expect(await current).toBe(true);
        expect(await shared).toBe(true);
        expect(getDid()).toBe('did:web:new');
    } finally {
        globalThis.fetch = original;
        clearAuth();
    }
});
