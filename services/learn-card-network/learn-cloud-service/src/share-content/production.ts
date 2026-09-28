import Redis from 'ioredis';

import { environment } from '@environment';
import {
    createShareContentRepository,
    getShareContentCollection,
    type ShareContentRepository,
} from '@accesslayer/share-content';
import { createSetIfAbsentReplayStore, type ReplayStore } from '@helpers/share-content-auth';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';

import { getShareContentRawConfig, resolveShareContentConfig } from './config';
import { buildShareContentRuntime, type ShareContentRuntime } from './runtime';

/**
 * Production wiring for the LC-2187 service routes. Kept separate from the pure
 * `runtime.ts` builder so the transport logic stays testable without the
 * environment/Mongo connection singletons.
 *
 * The replay store is a real ioredis `SET key 1 EX ttl NX`. There is
 * deliberately no `cache.node` / `ioredis-mock` fallback here: an absent or
 * unreachable Redis must fail closed, not silently accept every nonce.
 */

export type ShareContentReplayStoreHandle = {
    store: ReplayStore;
    close: () => Promise<void>;
};

export const createShareContentRedisReplayStore = (options: {
    host: string;
    port: number;
}): ShareContentReplayStoreHandle => {
    const client = new Redis({
        host: options.host,
        port: options.port,
        connectTimeout: 5_000,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
    });

    // Operational errors surface through the rejected command below. Never log
    // the endpoint, command or payload here.
    client.on('error', () => {});

    const store = createSetIfAbsentReplayStore(async (key, ttlSeconds) => {
        const result = await client.set(key, '1', 'EX', ttlSeconds, 'NX');

        // Explicit response handling: `OK` = newly created (allowed), `null` =
        // already present (replay), anything else is an unsafe surprise.
        if (result === 'OK') return true;
        if (result === null) return false;

        throw new Error('unexpected Redis SET NX response');
    });

    return {
        store,
        close: async () => {
            try {
                await client.quit();
            } catch {
                client.disconnect();
            }
        },
    };
};

export const createMongoShareContentRepository = async (): Promise<ShareContentRepository> => {
    const { mongodb } = await import('@mongo');

    return createShareContentRepository(getShareContentCollection(mongodb));
};

const requireRedisEndpoint = (): { host: string; port: number } => {
    const { REDIS_HOST: host, REDIS_PORT: port } = environment;

    if (!host || !port) {
        throw new Error(
            'LC-2187 share-content is enabled but REDIS_HOST/REDIS_PORT are not configured'
        );
    }

    return { host, port };
};

export const createShareContentRuntimeFromEnvironment = async (): Promise<ShareContentRuntime> =>
    buildShareContentRuntime(getShareContentRawConfig(environment), {
        getLearnCard: () => getEmptyLearnCard(),
        createReplayStore: () => createShareContentRedisReplayStore(requireRedisEndpoint()),
        getRepository: createMongoShareContentRepository,
    });

/**
 * Synchronous configuration gate for entrypoints that must fail fast before the
 * first request (Lambda cold start). Reads no connections and never weakens a
 * check.
 */
export const assertShareContentEnvironmentConfiguration = (): void => {
    const resolved = resolveShareContentConfig(getShareContentRawConfig(environment));

    if (resolved.status === 'invalid') {
        throw new Error(
            `Invalid LC-2187 share-content configuration: ${resolved.errors.join('; ')}`
        );
    }
};
