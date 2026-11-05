import { describe, expect, it, vi } from 'vitest';
import { classifyRequest, instrumentFetch, newRequestCounters } from './requests';

const server = 'https://staging.api.example.org/api';

describe('classifyRequest', () => {
    it.each([
        [`${server}/keys/escrow`, 'escrow'],
        [`${server}/keys/escrow/attestation?nonce=ab`, 'escrow'],
        [`${server}/keys/escrow/recover`, 'escrow'],
        [`${server}/keys/escrowx`, 'keys'],
        [`${server}/keys/auth-share`, 'keys'],
        [`${server}/keys/challenge`, 'keys'],
        [`${server}/verify-login-code`, 'lca_other'],
        [`${server}x/keys/escrow`, 'other'],
        [
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=k',
            'firebase',
        ],
        ['https://googleapis.com.evil.test/x', 'other'],
        ['not a url', 'other'],
    ])('%s -> %s', (url, expected) => {
        expect(classifyRequest(url, server)).toBe(expected);
    });
});

describe('instrumentFetch', () => {
    it('counts by class and status bucket, passing responses and errors through', async () => {
        const counters = newRequestCounters();
        const statuses = [200, 409, 429, 503, 400];
        const base = vi.fn<typeof fetch>(async () => {
            const status = statuses.shift();
            if (status === undefined) throw new TypeError('fetch failed');
            return new Response(null, { status });
        });
        const wrapped = instrumentFetch(base, server, counters);
        for (let i = 0; i < 5; i += 1)
            await wrapped(new URL(`${server}/keys/escrow/recover`), { method: 'POST' });
        await expect(wrapped(`${server}/keys/escrow/complete`)).rejects.toThrow('fetch failed');
        await wrapped(new Request(`${server}/keys/auth-share`)).catch(() => undefined);
        expect(counters.escrow).toEqual({
            count: 6,
            ok: 1,
            status409: 1,
            status429: 1,
            status4xx: 1,
            status5xx: 1,
            transport: 1,
        });
        expect(counters.keys.count).toBe(1);
        expect(base).toHaveBeenCalledTimes(7);
        expect(base.mock.calls[0][1]).toEqual({ method: 'POST' });
    });
});
