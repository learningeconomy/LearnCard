import { TRPCError } from '@trpc/server';
import {
    IncrementCounterEventValidator,
    GetCounterEventValidator,
    GetCountersEventValidator,
} from '@learncard/types';

import cache from '@cache';
import { incrementAppCounter } from '@accesslayer/app-counter/create';
import { getAppCounter, getAppCounters, countAppCounterKeys } from '@accesslayer/app-counter/read';

const MAX_COUNTER_KEYS_PER_USER_PER_APP = 50;
const COUNTER_RATE_LIMIT_PER_MIN = 100;

export const handleIncrementCounterEvent = async (
    _ctx: { domain: string },
    profile: { profileId: string },
    listingId: string,
    event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const parsed = IncrementCounterEventValidator.safeParse(event);

    if (!parsed.success) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid increment-counter event: ${parsed.error.message}`,
        });
    }

    const { key, amount } = parsed.data;

    // Rate limit: max 100 counter writes per user per app per minute
    const rateLimitKey = `app-counter-rate:${listingId}:${profile.profileId}`;
    const rateCount = await cache.incr(rateLimitKey, 60);

    if (rateCount === undefined) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Rate limiting service unavailable',
        });
    }

    if (rateCount > COUNTER_RATE_LIMIT_PER_MIN) {
        // tRPC does not support HTTP 429 natively, so we cast to BAD_REQUEST
        // while keeping the semantic code in the message for clients.
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS' as 'BAD_REQUEST',
            message: 'Rate limit exceeded: max 100 counter writes per user per app per minute',
        });
    }

    // Check if this is a new key and enforce the per-user-per-app key limit
    const existingCounter = await getAppCounter({
        profileId: profile.profileId,
        listingId,
        key,
    });

    if (!existingCounter) {
        const keyCount = await countAppCounterKeys({
            profileId: profile.profileId,
            listingId,
        });

        if (keyCount >= MAX_COUNTER_KEYS_PER_USER_PER_APP) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Max ${MAX_COUNTER_KEYS_PER_USER_PER_APP} counter keys per user per app`,
            });
        }
    }

    const result = await incrementAppCounter({
        profileId: profile.profileId,
        listingId,
        key,
        amount,
    });

    return {
        key,
        previousValue: result.previousValue,
        newValue: result.newValue,
    };
};

export const handleGetCounterEvent = async (
    _ctx: { domain: string },
    profile: { profileId: string },
    listingId: string,
    event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const parsed = GetCounterEventValidator.safeParse(event);

    if (!parsed.success) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid get-counter event: ${parsed.error.message}`,
        });
    }

    const { key } = parsed.data;

    const counter = await getAppCounter({
        profileId: profile.profileId,
        listingId,
        key,
    });

    return {
        key,
        value: counter?.value ?? 0,
        updatedAt: counter?.updatedAt ?? null,
    };
};

export const handleGetCountersEvent = async (
    _ctx: { domain: string },
    profile: { profileId: string },
    listingId: string,
    event: Record<string, unknown>
): Promise<Record<string, unknown>> => {
    const parsed = GetCountersEventValidator.safeParse(event);

    if (!parsed.success) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Invalid get-counters event: ${parsed.error.message}`,
        });
    }

    const { keys } = parsed.data;

    const counters = await getAppCounters({
        profileId: profile.profileId,
        listingId,
        keys,
    });

    return {
        counters: counters.map(c => ({
            key: c.key,
            value: c.value,
            updatedAt: c.updatedAt,
        })),
    };
};
