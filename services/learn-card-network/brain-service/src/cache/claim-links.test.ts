import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Redis from 'ioredis-mock';

vi.mock('@cache', () => ({ default: { node: undefined } }));
import cache from '@cache';
import {
    ClaimLinkUsageContentionError,
    getClaimLinkAvailability,
    getClaimLinkCacheKey,
    getClaimLinkOutcomeKey,
    getClaimLinkReplayKey,
    getTTLForClaimLink,
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
        vi.spyOn(redis, 'eval').mockImplementation(async (...args) => {
            if (String(args[0]).includes("local kind = redis.call('TYPE'"))
                return evalCommand(...args);
            vi.mocked(redis.eval).mockImplementation(evalCommand);
            await useClaimLinkForBoost(boostUri, challenge);
            return evalCommand(...args);
        });
        expect(await invalidateClaimLinkForBoost(boostUri, challenge)).toBe(0);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
    });

    it('does not leave permanent outcome metadata for links without expiry', async () => {
        await redis.set(getClaimLinkOutcomeKey(boostUri, challenge), '{}');
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        expect(await redis.get(getClaimLinkOutcomeKey(boostUri, challenge))).toBeNull();
    });

    it('treats malformed live cache data as an uncertain error rather than expiration', async () => {
        await redis.set(getClaimLinkCacheKey(boostUri, challenge), '{');
        await expect(getClaimLinkAvailability(boostUri, challenge)).rejects.toThrow();
    });

    it('counts a replayed accepted request once, including a lost usage acknowledgement', async () => {
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        const generation = await getClaimLinkGeneration(boostUri, challenge);
        const evalCommand = redis.eval.bind(redis);
        vi.spyOn(redis, 'eval').mockImplementation(async (...args) => {
            if (String(args[0]).includes("local kind = redis.call('TYPE'"))
                return evalCommand(...args);
            vi.mocked(redis.eval).mockImplementation(evalCommand);
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
        const replaySet = getClaimLinkReplayKey(boostUri, challenge, generation);
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
        const evalCommand = redis.eval.bind(redis);
        vi.spyOn(redis, 'eval').mockImplementation(async (...args) => {
            if (String(args[0]).includes("local kind = redis.call('TYPE'"))
                return evalCommand(...args);
            if (++attempts > 100) throw exhaustedBudget;
            return 0;
        });
        const failure = await useClaimLinkForBoost(
            boostUri,
            challenge,
            'contended-request',
            generation
        ).catch(error => error);
        expect(failure).toBeInstanceOf(ClaimLinkUsageContentionError);
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
        expect(await redis.exists(getClaimLinkReplayKey(boostUri, challenge, expiring))).toBe(0);
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
        expect(await redis.exists(getClaimLinkReplayKey(boostUri, challenge, permanent))).toBe(0);
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
        expect(await redis.exists(getClaimLinkReplayKey(boostUri, challenge))).toBe(0);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('unavailable');
        await setValidClaimLinkForBoost(boostUri, challenge, authority, { totalUses: 2 });
        await useClaimLinkForBoost(boostUri, challenge, 'legacy-operation');
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toMatchObject({
            totalUses: 2,
        });
    });
});

describe('claim-link key namespaces and legacy migration', () => {
    const oldKey = (value: string): string => `claimLink|${boostUri}|${value}`;
    const legacyLink = (totalUses = 3): string =>
        JSON.stringify({ claimLinkSA: authority, options: { totalUses } });

    it.each([undefined, 60])(
        'does not overwrite challenge suffixes when creating, consuming or invalidating (TTL %s)',
        async ttlSeconds => {
            for (const suffix of ['|outcome', '|replay|legacy', '|replay|generation']) {
                await setValidClaimLinkForBoost(boostUri, challenge + suffix, authority, {
                    totalUses: 7,
                });
            }
            await setValidClaimLinkForBoost(boostUri, challenge, authority, {
                ttlSeconds,
                totalUses: 1,
            });
            await useClaimLinkForBoost(boostUri, challenge);
            await setValidClaimLinkForBoost(boostUri, challenge, authority, { ttlSeconds });
            await invalidateClaimLinkForBoost(boostUri, challenge);
            for (const suffix of ['|outcome', '|replay|legacy', '|replay|generation']) {
                expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge + suffix)).toEqual(
                    {
                        totalUses: 7,
                    }
                );
            }
        }
    );

    it('encodes components independently even when both contain separators or encoding characters', () => {
        expect(getClaimLinkCacheKey('a|b', 'c')).not.toBe(getClaimLinkCacheKey('a', 'b|c'));
        for (const value of ['abc|outcome', 'abc|replay|legacy', 'a%7Cb', 'a|b', '你好', '']) {
            expect(getClaimLinkCacheKey(boostUri, value)).not.toBe(
                getClaimLinkOutcomeKey(boostUri, value)
            );
            expect(getClaimLinkCacheKey(boostUri, value)).not.toBe(
                getClaimLinkReplayKey(boostUri, value)
            );
        }
    });

    it('migrates legacy links without treating colliding live links as outcome or replay metadata', async () => {
        await redis.set(oldKey(challenge), legacyLink(1));
        await redis.set(oldKey(challenge + '|outcome'), legacyLink(7));
        await redis.set(oldKey(challenge + '|replay|legacy'), legacyLink(9));
        await useClaimLinkForBoost(boostUri, challenge);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge + '|outcome')).toEqual({
            totalUses: 7,
        });
        expect(
            await getClaimLinkOptionsInfoForBoost(boostUri, challenge + '|replay|legacy')
        ).toEqual({
            totalUses: 9,
        });
        await invalidateClaimLinkForBoost(boostUri, challenge + '|outcome');
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('exhausted');
    });

    it('preserves a legacy TTL and its successful consumption marker during migration', async () => {
        await redis.set(oldKey(challenge), legacyLink(2), 'EX', 60);
        await redis.sadd(oldKey(challenge) + '|replay|legacy', 'accepted');
        await redis.expire(oldKey(challenge) + '|replay|legacy', 60);
        await useClaimLinkForBoost(boostUri, challenge, 'accepted');
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toEqual({
            totalUses: 2,
        });
        expect(await getTTLForClaimLink(boostUri, challenge)).toBe(60);
        expect(await redis.exists(oldKey(challenge))).toBe(0);
        expect(await redis.sismember(getClaimLinkReplayKey(boostUri, challenge), 'accepted')).toBe(
            1
        );
        await vi.advanceTimersByTimeAsync(61_000);
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('expired');
    });

    it.each(['exhausted', 'unavailable'])(
        'preserves legacy %s evidence without a live link',
        async reason => {
            await redis.set(oldKey(challenge) + '|outcome', JSON.stringify({ reason }), 'EX', 60);
            expect(await getClaimLinkAvailability(boostUri, challenge)).toBe(reason);
            expect(await redis.ttl(getClaimLinkOutcomeKey(boostUri, challenge))).toBe(60);
            expect(await getClaimLinkAvailability(boostUri, challenge + '|outcome')).toBe(
                'unavailable'
            );
        }
    );

    it.each([undefined, 60])(
        'preserves legacy suffix links when creating a new link (TTL %s)',
        async ttlSeconds => {
            await redis.set(oldKey(challenge + '|outcome'), legacyLink(7));
            await setValidClaimLinkForBoost(boostUri, challenge, authority, { ttlSeconds });
            await invalidateClaimLinkForBoost(boostUri, challenge);
            expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge + '|outcome')).toEqual(
                { totalUses: 7 }
            );
        }
    );

    it('retries migration if a legacy writer changed capacity after the snapshot', async () => {
        await redis.set(oldKey(challenge), legacyLink(3));
        const evalCommand = redis.eval.bind(redis);
        vi.spyOn(redis, 'eval').mockImplementationOnce(async (...args) => {
            await redis.set(oldKey(challenge), legacyLink(2));
            return evalCommand(...args);
        });
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toEqual({
            totalUses: 2,
        });
        expect(await redis.exists(oldKey(challenge))).toBe(0);
    });

    it('serializes concurrent migration and finalization of the same legacy receipt', async () => {
        await redis.set(oldKey(challenge), legacyLink(3));
        await Promise.all(
            Array.from({ length: 12 }, () => useClaimLinkForBoost(boostUri, challenge, 'accepted'))
        );
        expect(await getClaimLinkOptionsInfoForBoost(boostUri, challenge)).toEqual({
            totalUses: 2,
        });
    });

    it('preserves legacy expiration evidence after the live key has already expired', async () => {
        await redis.set(
            oldKey(challenge) + '|outcome',
            JSON.stringify({ expiresAt: Date.now() - 1 }),
            'EX',
            60
        );
        expect(await getClaimLinkAvailability(boostUri, challenge)).toBe('expired');
    });

    it.each(['', '{', '{}', '{"options":{}}', '{"claimLinkSA":{}}', 'null', '"valid"'])(
        'keeps malformed legacy live values uncertain (%s)',
        async value => {
            await redis.set(oldKey(challenge), value);
            await expect(getClaimLinkAvailability(boostUri, challenge)).rejects.toThrow();
            expect(await redis.get(oldKey(challenge))).toBe(value);
            expect(await redis.exists(getClaimLinkCacheKey(boostUri, challenge))).toBe(0);
        }
    );

    it.each([{ reason: 'exhausted' }, { reason: 'unavailable' }, { expiresAt: 1 }])(
        'does not treat genuine legacy outcome metadata as a corrupt live link (%j)',
        async evidence => {
            await redis.set(oldKey(challenge + '|outcome'), JSON.stringify(evidence));
            expect(await getClaimLinkAvailability(boostUri, challenge + '|outcome')).toBe(
                'unavailable'
            );
            expect(await redis.get(oldKey(challenge + '|outcome'))).toBe(JSON.stringify(evidence));
        }
    );

    it('does not parse legacy replay metadata as a live link', async () => {
        await redis.sadd(oldKey(challenge + '|replay|legacy'), 'accepted');
        expect(await getClaimLinkAvailability(boostUri, challenge + '|replay|legacy')).toBe(
            'unavailable'
        );
    });
});
