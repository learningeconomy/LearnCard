import type { StagingGlobal } from './contracts';
import { afterEach, expect, test } from 'bun:test';
import { canonicalJSON, installStagingFetch, staging } from './staging';

const originalFetch = globalThis.fetch;
const priorWebkit = (globalThis as typeof globalThis & StagingGlobal).webkit;
afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as typeof globalThis & StagingGlobal).webkit = priorWebkit;
});

test('the native bridge preserves Response.url for DIDKit WASM resolution', async () => {
    (globalThis as typeof globalThis & StagingGlobal).webkit = {
        messageHandlers: {
            stagingTransport: {
                postMessage: async () => ({
                    status: 200,
                    body: '{"id":"test-document"}',
                    contentType: 'application/json',
                }),
            },
        },
    };
    installStagingFetch();
    const url = 'https://staging.network.learncard.com/users/test-document/did.json';
    const response = await fetch(url);
    expect(response.url).toBe(url);
    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({ id: 'test-document' });
});

test('an SDK production fallback cannot make an authenticated request', async () => {
    let requests = 0;
    globalThis.fetch = (async () => {
        requests++;
        return new Response('{}');
    }) as typeof fetch;
    installStagingFetch();
    for (const url of [
        'https://network.learncard.com/trpc/profile.createProfile',
        'https://cloud.learncard.com/trpc/index.add',
        'https://staging.network.learncard.com.evil.test/trpc',
        'https://user:password@staging.network.learncard.com/trpc',
    ]) {
        await expect(
            fetch(url, { method: 'POST', headers: { Authorization: 'Bearer test-only' } })
        ).rejects.toThrow('refused');
    }
    expect(requests).toBe(0);
});

test('staging SDK transport preserves a POST and rejects redirect forwarding', async () => {
    let captured: RequestInit | undefined;
    globalThis.fetch = (async (_url, options) => {
        captured = options;
        return new Response('{}');
    }) as typeof fetch;
    installStagingFetch();
    await fetch(`${staging.network}/profile.getProfile?batch=1`, {
        method: 'POST',
        body: '{"0":{}}',
        headers: { Authorization: 'Bearer test-only' },
    });
    expect(captured?.method).toBe('POST');
    expect(captured?.body).toBe('{"0":{}}');
    expect(captured?.redirect).toBe('error');
    expect(captured?.credentials).toBe('omit');
});

test('credential comparisons ignore dictionary order and preserve array order and values', () => {
    expect(canonicalJSON({ proof: { z: 'é', a: 1 }, type: ['VC', 'Badge'] })).toBe(
        canonicalJSON({ type: ['VC', 'Badge'], proof: { a: 1, z: 'é' } })
    );
    expect(canonicalJSON({ type: ['VC', 'Badge'] })).not.toBe(
        canonicalJSON({ type: ['Badge', 'VC'] })
    );
    expect(canonicalJSON({ value: 1 })).not.toBe(canonicalJSON({ value: '1' }));
});
