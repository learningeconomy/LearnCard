import type Redis from 'ioredis';
import { createHash, randomUUID } from 'node:crypto';
import {
    assertOwnerOperationActive,
    DataErasureRequestedError,
    getCurrentOwnerOperation,
} from '../services/dataErasure';
import { evalOwnerMutation } from './cache';

type SingleFlightStore = Pick<Redis, 'eval'>;
type SingleFlightOptions = {
    lockTtlMs?: number;
    pollIntervalMs?: number;
    waitTimeoutMs?: number;
};
export const createDistributedSingleFlight = (store: SingleFlightStore) => {
    const inFlight = new Map<string, Promise<unknown>>();
    return async <T>(
        key: string,
        operation: () => Promise<T>,
        options: SingleFlightOptions = {}
    ): Promise<T> => {
        const owner = getCurrentOwnerOperation();
        if (!owner) throw new DataErasureRequestedError();
        await assertOwnerOperationActive(owner.did);
        const lockKey = `single-flight:${owner.subjectRef}:${createHash('sha256').update(key).digest('hex')}`;
        const existing = inFlight.get(lockKey);
        if (existing) {
            const result = (await existing) as T;
            await assertOwnerOperationActive(owner.did);
            return result;
        }
        const promise = (async () => {
            const token = randomUUID();
            const lockTtlMs = options.lockTtlMs ?? 5 * 60_000;
            const deadline = Date.now() + (options.waitTimeoutMs ?? Math.min(lockTtlMs, 30_000));
            while (Date.now() < deadline) {
                const acquired = await evalOwnerMutation(
                    store,
                    owner.did,
                    `return redis.call("SET", KEYS[4], ARGV[2], "PX", ARGV[3], "NX")`,
                    [lockKey],
                    [token, lockTtlMs]
                );
                if (acquired === 'OK') {
                    try {
                        const result = await operation();
                        await assertOwnerOperationActive(owner.did);
                        return result;
                    } finally {
                        // If the lease is revoked the lock expires naturally; no unfenced fallback.
                        await evalOwnerMutation(
                            store,
                            owner.did,
                            `
if redis.call("GET", KEYS[4]) == ARGV[2] then return redis.call("DEL", KEYS[4]) end
return 0`,
                            [lockKey],
                            [token]
                        );
                    }
                }
                await Bun.sleep(options.pollIntervalMs ?? 50);
            }
            throw new Error('Timed out waiting for owner single-flight lock');
        })();
        inFlight.set(lockKey, promise);
        try {
            return await promise;
        } finally {
            if (inFlight.get(lockKey) === promise) inFlight.delete(lockKey);
        }
    };
};
