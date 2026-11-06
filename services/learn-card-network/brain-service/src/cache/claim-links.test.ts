import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Redis from 'ioredis-mock';

vi.mock('@cache', () => ({ default: { node: undefined } }));
import cache from '@cache';
import {
    getClaimLinkAvailability,
    getClaimLinkCacheKey,
    getClaimLinkGeneration,
    getClaimLinkOptionsInfoForBoost,
    invalidateClaimLinkForBoost,
    setValidClaimLinkForBoost,
    useClaimLinkForBoost,
} from './claim-links';

const boostUri = 'lc:network:example.test/trpc:boost:one';
const challenge = 'challenge';
const authority = { name: 'school', endpoint: 'https://signer.example.test' };
cache.node = new Redis();
const redis = cache.node;

beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T00:00:00.000Z'));
    await redis.flushall();
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('claim-link outcome evidence and retry-safe usage', () => {
    it('distinguishes actual expiry, exhausted capacity, and unknown historical links', async () => {
        expect(await getClaimLinkAvailability(boostUri, 'unknown')).toBe('unavailable');
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { ttlSeconds: 1 });
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('available');
        await vi.advanceTimersByTimeAsync(1100);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('expired');
        await setValidClaimLinkForBoost(boostUri, 'last-use', authority, { totalUses: 1 });
        await useClaimLinkForBoost(boostUri, 'last-use');
        expect(await getClaimLinkAvailability(boostUri, 'last-use')).toBe('exhausted');
    });

    it.each(['expired', 'exhausted'] as const)(
        'preserves confirmed %s evidence when invalidating an absent link',
        async reason => {
            await setValidClaimLinkForBoost(
                boostUri,
                challenge,
                authority,
                reason === 'expired' ? { ttlSeconds: 1 } : { totalUses: 1 }
            );
            if (reason === 'expired') await vi.advanceTimersByTimeAsync(1100);
            else await useClaimLinkForBoost(boostUri, challenge);
            expect(await getClaimLinkAvailability(boostUri, challenge)).toBe(reason);
            expect(await invalidateClaimLinkForBoost(boostUri, challenge)).toBe(0);
            expect(await getClaimLinkAvailability(boostUri, challenge)).toBe(reason);
        }
    );

    it('preserves exhaustion when the last claim wins a race with invalidation', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 1 });
        const evalCommand = redis.eval.bind(redis);
        vi.spyOn(redis, 'eval').mockImplementationOnce(async (...args) => {
            await useClaimLinkForBoost(boostUri, challenge);
            return evalCommand(...args);
        });
        expect(await invalidateClaimLinkForBoost(boostUri, challenge)).toBe(0);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
    });

    it('does not leave permanent outcome metadata for links without expiry', async () => {
        await redis.set(`${getClaimLinkCacheKey(boostUri, challenge)}|outcome`, '{}');
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        expect(await redis.get(`${getClaimLinkCacheKey(boostUri, challenge)}|outcome`)).toBeNull();
    });

    it('treats malformed live cache data as an uncertain error rather than expiration', async () => {
        await redis.set(getClaimLinkCacheKey(boostUri, challenge), '{');
        await expect(getClaimLinkAvailability(boostUri, challenge)).rejects.toThrow();
    });

    it('counts a replayed accepted request once, including a lost usage acknowledgement', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        const generation = await getClaimLinkGeneration(boostUri, challenge);
        const evalCommand = redis.eval.bind(redis);
        vi.spyOn(redis, 'eval').mockImplementationOnce(async (...args) => {
            await evalCommand(...args);
            throw new Error('acknowledgement lost');
        });
        await expect(
            useClaimLinkForBoost(boostUri, challenge, 'request-one', generation)
        ).rejects.toThrow('acknowledgement lost');
        await useClaimLinkForBoost(boostUri, challenge, 'request-one', generation);
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 1,
        });
        await useClaimLinkForBoost(boostUri, challenge, 'request-two', generation);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
        await useClaimLinkForBoost(boostUri, challenge, 'request-one', generation);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
    });
    it('keeps replay evidence for the live generation and removes it on invalidation', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, {
            totalUses: 3,
            ttlSeconds: 60,
        });
        const generation = await getClaimLinkGeneration(boostUri, challenge);
        await useClaimLinkForBoost(boostUri, challenge, 'persistent-request', generation);
        const replaySet = `${getClaimLinkCacheKey(boostUri, challenge)}|replay|${generation}`;
        expect(await redis.sismember(replaySet, 'persistent-request')).toBe(1);
        expect(await redis.pttl(replaySet)).toBeGreaterThan(0);
        await invalidateClaimLinkForBoost(boostUri, challenge);
        expect(await redis.exists(replaySet)).toBe(0);
    });

    it('fails honestly after bounded sustained CAS contention', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 3 });
        const generation = await getClaimLinkGeneration(boostUri, challenge);
        const exhaustedBudget = new Error('Redis probe safety budget exceeded');
        let attempts = 0;
        vi.spyOn(redis, 'eval').mockImplementation(async () => {
            if (++attempts > 100) throw exhaustedBudget;
            return 0;
        });
        const failure = await useClaimLinkForBoost(
            boostUri,
            challenge,
            'contended-request',
            generation
        ).catch(error => error);
        expect(failure).toBeInstanceOf(Error);
        expect(failure).not.toBe(exhaustedBudget);
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 3,
        });
    });

    it('expires replay evidence with its link but retains it for a live non-expiring generation', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, {
            totalUses: 3,
            ttlSeconds: 1,
        });
        const expiring = await getClaimLinkGeneration(boostUri, challenge);
        await useClaimLinkForBoost(boostUri, challenge, 'one', expiring);
        await vi.advanceTimersByTimeAsync(1100);
        expect(
            await redis.exists(`${getClaimLinkCacheKey(boostUri, challenge)}|replay|${expiring}`)
        ).toBe(0);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('expired');

        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 3 });
        const permanent = await getClaimLinkGeneration(boostUri, challenge);
        await useClaimLinkForBoost(boostUri, challenge, 'one', permanent);
        await vi.advanceTimersByTimeAsync(31 * 24 * 60 * 60 * 1000);
        await useClaimLinkForBoost(boostUri, challenge, 'one', permanent);
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 2,
        });
        await invalidateClaimLinkForBoost(boostUri, challenge);
        expect(
            await redis.exists(`${getClaimLinkCacheKey(boostUri, challenge)}|replay|${permanent}`)
        ).toBe(0);
    });

    it('does not consume a replacement link while finalizing an older request', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        const original = await getClaimLinkGeneration(boostUri, challenge);
        await invalidateClaimLinkForBoost(boostUri, challenge);
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        const replacement = await getClaimLinkGeneration(boostUri, challenge);
        await useClaimLinkForBoost(boostUri, challenge, 'older-request', original);
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 2,
        });
        await useClaimLinkForBoost(boostUri, challenge, 'new-request', replacement);
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 1,
        });
    });

    it('serializes concurrent finalization of the same accepted request', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        const generation = await getClaimLinkGeneration(boostUri, challenge);
        await Promise.all(
            Array.from({ length: 12 }, () =>
                useClaimLinkForBoost(boostUri, challenge, 'same-request', generation)
            )
        );
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 1,
        });
    });

    it('keeps revocation and cache transport failure distinct from expiry', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { ttlSeconds: 1 });
        await invalidateClaimLinkForBoost(boostUri, challenge);
        await vi.advanceTimersByTimeAsync(1100);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('unavailable');
        vi.spyOn(redis, 'mget').mockRejectedValueOnce(new Error('connection lost'));
        await expect(getClaimLinkAvailability(boostUri, challenge)).rejects.toThrow(
            'connection lost'
        );
    });

    it('reconciles and invalidates a live link created before generation metadata existed', async () => {
        await redis.set(
            getClaimLinkCacheKey(boostUri, challenge),
            JSON.stringify({ claimLinkSA: authority, options: { totalUses: 3 } })
        );
        await useClaimLinkForBoost(boostUri, challenge, 'legacy-operation');
        await useClaimLinkForBoost(boostUri, challenge, 'legacy-operation');
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 2,
        });
        await invalidateClaimLinkForBoost(boostUri, challenge);
        expect(
            await redis.exists(`${getClaimLinkCacheKey(boostUri, challenge)}|replay|legacy`)
        ).toBe(0);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('unavailable');
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        await useClaimLinkForBoost(boostUri, challenge, 'legacy-operation');
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 2,
        });
    });
});
