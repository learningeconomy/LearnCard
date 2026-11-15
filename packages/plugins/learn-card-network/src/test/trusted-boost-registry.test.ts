import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { getVerifyBoostPlugin } from '../plugin';
import {
    resetTrustedBoostRegistryCache,
    TRUSTED_BOOST_REGISTRY_TIMEOUT_MS,
} from '../trustedBoostRegistry';

const registryUrl = 'https://registry.example/trusted-app-registry.json';
const remoteNetwork = {
    id: 'Remote Network',
    did: 'did:web:remote.example',
    url: 'https://remote.example',
};
const remoteBoost = {
    issuer: 'did:key:z6MkSigningAuthority',
    boostId: 'lc:network:remote.example/trpc:boost:test',
    type: ['BoostCredential'],
} as unknown as VC;

const makeCard = () =>
    ({
        invoke: {
            verifyCredential: vi
                .fn()
                .mockResolvedValue({ errors: [], warnings: [], checks: ['proof'] }),
        },
    }) as unknown as Parameters<typeof getVerifyBoostPlugin>[0];

const registryResponse = () => new Response(JSON.stringify([remoteNetwork]), { status: 200 });

/** A fetch that never settles unless aborted, like a stalled raw.githubusercontent.com request. */
const hungFetch = vi.fn(
    (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
);

beforeEach(() => {
    resetTrustedBoostRegistryCache();
    hungFetch.mockClear();
});

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('trusted Boost registry loading', () => {
    it('does not fetch the registry while the plugin is created', async () => {
        const fetch = vi.fn().mockResolvedValue(registryResponse());
        vi.stubGlobal('fetch', fetch);

        await getVerifyBoostPlugin(makeCard(), registryUrl);

        expect(fetch).not.toHaveBeenCalled();
    });

    it('creates the plugin immediately when the registry host hangs', async () => {
        vi.stubGlobal('fetch', hungFetch);
        const startedAt = performance.now();

        await getVerifyBoostPlugin(makeCard(), registryUrl);

        expect(performance.now() - startedAt).toBeLessThan(50);
        expect(hungFetch).not.toHaveBeenCalled();
    });

    it('does not fetch for a credential that needs no trust lookup', async () => {
        const fetch = vi.fn().mockResolvedValue(registryResponse());
        vi.stubGlobal('fetch', fetch);
        const card = makeCard();
        const plugin = await getVerifyBoostPlugin(card, registryUrl);

        await plugin.methods.verifyCredential(card, {
            issuer: 'did:key:z6Mk',
            type: [],
        } as unknown as VC);

        expect(fetch).not.toHaveBeenCalled();
    });

    it('fetches once on first verification and reuses it across verifications', async () => {
        const fetch = vi.fn().mockImplementation(async () => registryResponse());
        vi.stubGlobal('fetch', fetch);
        const card = makeCard();
        const plugin = await getVerifyBoostPlugin(card, registryUrl);
        const otherPlugin = await getVerifyBoostPlugin(card, registryUrl);

        const results = await Promise.all([
            plugin.methods.verifyCredential(card, remoteBoost),
            plugin.methods.verifyCredential(card, remoteBoost),
            otherPlugin.methods.verifyCredential(card, remoteBoost),
        ]);

        expect(fetch).toHaveBeenCalledTimes(1);
        for (const verified of results) {
            expect(verified.checks).toContain('Boost is Authentic. Verified by Remote Network.');
        }
    });

    it('treats a hung registry as untrusted after the timeout and retries next time', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', hungFetch);
        const card = makeCard();
        const plugin = await getVerifyBoostPlugin(card, registryUrl);

        let settled = false;
        const verification = plugin.methods.verifyCredential(card, remoteBoost).finally(() => {
            settled = true;
        });
        await vi.advanceTimersByTimeAsync(TRUSTED_BOOST_REGISTRY_TIMEOUT_MS - 1);
        expect(settled).toBe(false);
        await vi.advanceTimersByTimeAsync(1);
        const verified = await verification;

        expect(hungFetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        expect(verified.errors).toEqual([]);
        expect(verified.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
        expect(verified.warnings).toEqual([
            'Boost Authenticity could not be verified. Boost ID does not identify a trusted network: lc:network:remote.example/trpc:boost:test',
        ]);

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(registryResponse()));
        const retried = await plugin.methods.verifyCredential(card, remoteBoost);
        expect(retried.checks).toContain('Boost is Authentic. Verified by Remote Network.');
    });

    it.each([
        ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
        ['a non-200 response', async () => new Response('nope', { status: 503 })],
        ['malformed JSON', async () => new Response('{', { status: 200 })],
        ['a non-registry body', async () => new Response('{"did":"x"}', { status: 200 })],
    ])('falls back to the default registry on %s', async (_label, fetchImpl) => {
        vi.stubGlobal('fetch', vi.fn(fetchImpl));
        const card = makeCard();
        const plugin = await getVerifyBoostPlugin(card, registryUrl);

        const remote = await plugin.methods.verifyCredential(card, remoteBoost);
        expect(remote.checks.some(check => check.includes('Boost is Authentic'))).toBe(false);
        expect(remote.errors).toEqual([]);

        const learnCardNetwork = await plugin.methods.verifyCredential(card, {
            ...remoteBoost,
            boostId: 'lc:network:network.learncard.com/trpc:boost:test',
        } as unknown as VC);
        expect(learnCardNetwork.checks).toContain(
            'Boost is Authentic. Verified by LearnCard Network.'
        );
    });
});
