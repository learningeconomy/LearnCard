import { afterEach, expect, test } from 'bun:test';
import { AdminAccessError, readAdminCoverage, readAdminStatus } from '../admin-read';
import { auth, clearAuth } from '../auth';
import { boundedRequest } from '../bounded-request';
const original = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = original;
    clearAuth();
});
const mockFetch = (fn: (path: string, init?: RequestInit) => Promise<Response>) => {
    globalThis.fetch = Object.assign(
        (url: any, init?: RequestInit) => fn(new URL(url).pathname, init),
        { preconnect: original.preconnect }
    );
};

test('status auth and coverage are independent real read paths', async () => {
    auth.set({ did: 'did:web:fixture' });
    let coverageSignal: AbortSignal | undefined;
    mockFetch(async (path, init) => {
        if (path === '/auth/session')
            return Response.json({ authenticated: true, did: 'did:web:fixture' });
        if (path === '/admin/embeddings') return Response.json({ fresh: false });
        coverageSignal = init?.signal ?? undefined;
        return new Promise(() => {});
    });
    const controller = new AbortController();
    const coverage = readAdminCoverage(controller.signal);
    const status = await readAdminStatus(new AbortController().signal);
    expect(status).toEqual({ fresh: false });
    expect(coverageSignal?.aborted).toBe(false);
    controller.abort(new Error('test complete'));
    await expect(coverage).rejects.toThrow('test complete');
});

for (const status of [401, 403]) {
    test(`non-JSON ${status} coverage denial is authoritative`, async () => {
        mockFetch(async () => new Response('bad body', { status }));
        await expect(readAdminCoverage(new AbortController().signal)).rejects.toBeInstanceOf(
            AdminAccessError
        );
    });
}

test('coverage 503 remains a transient read error', async () => {
    mockFetch(async () =>
        Response.json({ reason: 'Vector inventory unavailable' }, { status: 503 })
    );
    try {
        await readAdminCoverage(new AbortController().signal);
        throw new Error('expected failure');
    } catch (error) {
        expect(error).not.toBeInstanceOf(AdminAccessError);
        expect((error as Error).message).toBe('Vector inventory unavailable');
    }
});

test('bounded reads cancel the transport even when the transport ignores abort', async () => {
    let signal!: AbortSignal;
    await expect(
        boundedRequest(
            requestSignal => {
                signal = requestSignal;
                return new Promise(() => {});
            },
            undefined,
            5
        )
    ).rejects.toThrow('Read timed out');
    expect(signal.aborted).toBe(true);
});
