import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Redis from 'ioredis-mock';

vi.mock('@cache', () => ({ default: { node: undefined } }));
import cache from '@cache';
import {
    getClaimLinkAvailability,
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
});
