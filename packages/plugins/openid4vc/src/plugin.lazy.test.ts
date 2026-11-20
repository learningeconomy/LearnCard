import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OpenID4VCDependentLearnCard } from './types';

// The implementation chunk, as the browser sees it: the next `failures` imports reject the way a
// stale chunk does after a deploy, then imports succeed with a stub implementation.
const chunk = { failures: 0, builds: 0 };

const STALE_CHUNK = 'Failed to fetch dynamically imported module';

const loadPlugin = async () => {
    vi.resetModules();
    vi.doMock('./plugin', () => {
        if (chunk.failures > 0) {
            chunk.failures -= 1;
            throw new TypeError(`${STALE_CHUNK}: https://app.example/assets/plugin-abc123.js`);
        }
        return {
            getOpenID4VCPlugin: () => {
                chunk.builds += 1;
                return { methods: { resolveCredentialOffer: async () => 'resolved offer' } };
            },
        };
    });
    const { getOpenID4VCPlugin } = await import('./plugin.lazy');
    const plugin = getOpenID4VCPlugin({} as OpenID4VCDependentLearnCard);
    return () =>
        plugin.methods.resolveCredentialOffer({} as never, 'openid-credential-offer://x' as never);
};

/** The rejection's message; vitest wraps a throwing mock factory, so the chunk's error is its cause. */
const failureOf = (call: Promise<unknown>) =>
    call.then(
        () => 'resolved',
        (error: { cause?: unknown }) => String(error?.cause ?? error)
    );

describe('getOpenID4VCPlugin (lazy implementation)', () => {
    beforeEach(() => {
        chunk.failures = 0;
        chunk.builds = 0;
    });

    it('retries a failed import once in place', async () => {
        chunk.failures = 1;
        const resolve = await loadPlugin();

        await expect(resolve()).resolves.toBe('resolved offer');
    });

    it('does not replay a failed load: the call rejects, the next call loads and succeeds, later calls reuse it', async () => {
        chunk.failures = 2;
        const resolve = await loadPlugin();

        expect(await failureOf(resolve())).toMatch(STALE_CHUNK);

        await expect(resolve()).resolves.toBe('resolved offer');
        await expect(resolve()).resolves.toBe('resolved offer');
        expect(chunk.builds).toBe(1);
    });
});
