import { describe, expect, it, vi } from 'vitest';

import { createRetryableLazyInitializer } from '@helpers/share-link-owner/lazy-initializer';
import { mergeShareLinkPolicyConservatively } from '@helpers/share-link-policy/resolver';
import { DEFAULT_SHARE_LINK_POLICY } from '@helpers/share-link-policy/types';
import type { ShareLinkPolicySnapshot } from '@helpers/share-link-policy/types';

const adultPolicy: ShareLinkPolicySnapshot = {
    isMinor: false,
    policyResolved: true,
    defaultExpiryDays: 365,
    viewCountingEnabled: true,
};

describe('createRetryableLazyInitializer', () => {
    it('shares one in-flight build across concurrent callers', async () => {
        const build = vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 5));
            return { ready: true };
        });
        const initialize = createRetryableLazyInitializer(build);

        const [first, second] = await Promise.all([initialize(), initialize()]);

        expect(build).toHaveBeenCalledTimes(1);
        expect(first).toEqual({ ready: true });
        expect(second).toBe(first);
    });

    it('retries after a transient failure and caches the later success', async () => {
        const build = vi
            .fn<() => Promise<string>>()
            .mockRejectedValueOnce(new Error('constraint setup failed'))
            .mockResolvedValue('ready');
        const initialize = createRetryableLazyInitializer(build);

        await expect(initialize()).rejects.toThrow('constraint setup failed');
        await expect(initialize()).resolves.toBe('ready');
        await expect(initialize()).resolves.toBe('ready');

        // The failed attempt is never cached; the successful one is.
        expect(build).toHaveBeenCalledTimes(2);
    });

    it('does not poison the cache when concurrent callers fail', async () => {
        const build = vi
            .fn<() => Promise<number>>()
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValue(7);
        const initialize = createRetryableLazyInitializer(build);

        const firstRound = await Promise.allSettled([initialize(), initialize()]);
        expect(firstRound.every(settled => settled.status === 'rejected')).toBe(true);
        // The two concurrent callers shared one failed attempt.
        expect(build).toHaveBeenCalledTimes(1);

        await expect(initialize()).resolves.toBe(7);
    });
});

describe('mergeShareLinkPolicyConservatively', () => {
    it('never re-enables view counting from a stale permissive reservation', () => {
        const managedAdult: ShareLinkPolicySnapshot = {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        };

        expect(mergeShareLinkPolicyConservatively(managedAdult, adultPolicy)).toEqual({
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        });
    });

    it('applies a new restrictive reservation over a permissive committed policy', () => {
        const merged = mergeShareLinkPolicyConservatively(adultPolicy, DEFAULT_SHARE_LINK_POLICY);

        expect(merged.viewCountingEnabled).toBe(false);
        expect(merged.policyResolved).toBe(false);
        expect(merged.isMinor).toBeNull();
        expect(merged.defaultExpiryDays).toBe(30);
    });

    it('treats a known minor on either side as a minor', () => {
        const minor: ShareLinkPolicySnapshot = {
            isMinor: true,
            policyResolved: true,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        };

        expect(mergeShareLinkPolicyConservatively(adultPolicy, minor).isMinor).toBe(true);
        expect(mergeShareLinkPolicyConservatively(minor, adultPolicy).isMinor).toBe(true);
    });

    it('keeps both-adult known and both-resolved only', () => {
        expect(mergeShareLinkPolicyConservatively(adultPolicy, adultPolicy)).toEqual(adultPolicy);
    });
});
