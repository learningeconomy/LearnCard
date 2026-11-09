import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSSStrategy } from '@learncard/sss-key-manager';

describe('fetchArchivedKey', () => {
    const archived = { available: true, privateKey: 'a'.repeat(64), did: 'did:key:zArchive' };
    const lookup = () =>
        createSSSStrategy({
            serverUrl: 'https://example.com/api',
            tenantId: 'test-tenant',
        }).fetchArchivedKey!('test-token', 'firebase');

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('returns validated material with the same request conventions as auth-share', async () => {
        const fetchMock = vi.fn().mockResolvedValue(Response.json(archived));
        vi.stubGlobal('fetch', fetchMock);
        expect(await lookup()).toEqual({ privateKey: archived.privateKey, did: archived.did });
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/keys/archived-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'test-tenant' },
            body: JSON.stringify({ authToken: 'test-token', providerType: 'firebase' }),
            signal: expect.any(AbortSignal),
        });
    });

    it.each([
        { available: false },
        { ...archived, available: 'true' },
        { ...archived, privateKey: 'a'.repeat(63) },
        { ...archived, privateKey: 'g'.repeat(64) },
        { ...archived, privateKey: 123 },
        { ...archived, privateKey: undefined },
        { ...archived, did: 'did:web:example.com' },
        { ...archived, did: 123 },
        { ...archived, did: undefined },
        null,
        [],
    ])('returns null for unavailable or malformed material %#', async body => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));
        expect(await lookup()).toBeNull();
    });

    it('accepts uppercase hex', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(Response.json({ ...archived, privateKey: 'A'.repeat(64) }))
        );
        expect(await lookup()).toMatchObject({ privateKey: 'A'.repeat(64) });
    });

    it.each([404, 500])('returns null on HTTP %s', async status => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status })));
        expect(await lookup()).toBeNull();
    });

    it('returns null on malformed JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{')));
        expect(await lookup()).toBeNull();
    });

    it('returns null on network failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('request failed')));
        expect(await lookup()).toBeNull();
    });

    it('aborts after eight seconds and clears the timer', async () => {
        vi.useFakeTimers();
        let signal: AbortSignal | null | undefined;
        vi.stubGlobal(
            'fetch',
            vi.fn((_url: string, init: RequestInit) => {
                signal = init.signal;
                return new Promise<Response>((_resolve, reject) => {
                    signal?.addEventListener('abort', () => reject(new Error('aborted')));
                });
            })
        );
        const result = lookup();
        await vi.advanceTimersByTimeAsync(7999);
        expect(signal?.aborted).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        expect(signal?.aborted).toBe(true);
        expect(await result).toBeNull();
        expect(vi.getTimerCount()).toBe(0);
    });
});
