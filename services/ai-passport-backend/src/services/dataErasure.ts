import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { REDIS_PREFIX } from '../constants/env';
import { getPrivacyKeyMaterial, getPrivacySubjectRef } from '../ai/privacy-keys';
import cache from '../utils/cache';

export class DataErasureRequestedError extends Error {
    readonly code = 'data_erasure_requested';
    constructor() {
        super('Owner operation is unavailable or data erasure is in progress');
        this.name = 'DataErasureRequestedError';
    }
}

export const PRIVACY_MAINTENANCE_KEY = `${REDIS_PREFIX}:privacy:maintenance`;
export const PENDING_ERASURES_KEY = `${REDIS_PREFIX}:privacy:pending-erasures`;
const tombstoneKey = (did: string) =>
    `${REDIS_PREFIX}:privacy:erasure:${getPrivacySubjectRef(did)}`;
const activeOperationsKey = (did: string) =>
    `${REDIS_PREFIX}:privacy:active:${getPrivacySubjectRef(did)}`;
const OPERATION_LEASE_MS = 2 * 60 * 1000;
const OPERATION_HEARTBEAT_MS = 30 * 1000;
type OwnerOperation = {
    did: string;
    subjectRef: string;
    token: string;
    signal: AbortSignal;
};
type OperationScope = OwnerOperation & { controller: AbortController };
const operations = new AsyncLocalStorage<OperationScope>();
type OwnerSocket = {
    send: (data: string) => unknown;
    close: (code?: number, reason?: string) => unknown;
};
const ownerSockets = new Map<string, Set<OwnerSocket>>();

// The first three keys are always the tombstone, live operations, and maintenance key.
// ARGV[1] is the lease token. Embed this guard in the SAME script as each write.
export const OWNER_OPERATION_FENCE_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 1 or redis.call("EXISTS", KEYS[3]) == 1 then
  return redis.error_reply("OWNER_OPERATION_INACTIVE")
end
local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local expires = redis.call("ZSCORE", KEYS[2], ARGV[1])
if not expires or tonumber(expires) <= now then
  return redis.error_reply("OWNER_OPERATION_INACTIVE")
end
`;
const BEGIN_OPERATION_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 1 or redis.call("EXISTS", KEYS[3]) == 1 then return 0 end
local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
redis.call("ZADD", KEYS[2], now + tonumber(ARGV[2]), ARGV[1])
redis.call("PEXPIRE", KEYS[2], tonumber(ARGV[2]) * 2)
return 1
`;
const RENEW_OPERATION_SCRIPT = `${OWNER_OPERATION_FENCE_SCRIPT}
redis.call("ZADD", KEYS[2], now + tonumber(ARGV[2]), ARGV[1])
redis.call("PEXPIRE", KEYS[2], tonumber(ARGV[2]) * 2)
return 1
`;
const COUNT_OPERATIONS_SCRIPT = `
local clock = redis.call("TIME")
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now)
return redis.call("ZCARD", KEYS[1])
`;
const tombstoneStore = () => {
    if (!cache.redis) throw new Error('Persistent Redis is required for data erasure');
    return cache.redis;
};

export const assertPrivacyRuntimeReady = async (): Promise<void> => {
    const store = tombstoneStore();
    if ((await store.ping()) !== 'PONG') throw new Error('Persistent Redis is unavailable');
    if (await store.exists(PRIVACY_MAINTENANCE_KEY)) throw new DataErasureRequestedError();
};

type ErasureRequest = { requestedAt: string; completedAt?: string };

export const requestDataErasure = async (did: string): Promise<ErasureRequest> => {
    const subjectRef = getPrivacySubjectRef(did);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getPrivacyKeyMaterial().erasureRequest, iv);
    cipher.setAAD(Buffer.from(`erasure-request:v1:${subjectRef}`));
    const encrypted = Buffer.concat([cipher.update(did, 'utf8'), cipher.final()]);
    const payload = JSON.stringify({
        iv: iv.toString('base64'),
        ciphertext: encrypted.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
    });
    // The durable outbox and permanent admission fence must be written together.
    const result = await tombstoneStore().eval(
        `local existing = redis.call("GET", KEYS[1])
local request = existing or ARGV[1]
if not existing then redis.call("SET", KEYS[1], request) end
if not cjson.decode(request).completedAt then
  redis.call("HSETNX", KEYS[2], ARGV[2], ARGV[3])
end
return request`,
        2,
        tombstoneKey(did),
        PENDING_ERASURES_KEY,
        JSON.stringify({ requestedAt: new Date().toISOString() }),
        subjectRef,
        payload
    );
    return JSON.parse(String(result)) as ErasureRequest;
};

export const completeDataErasure = async (did: string): Promise<{ completedAt: string }> => {
    const result = await tombstoneStore().eval(
        `local raw = redis.call("GET", KEYS[1])
if not raw then return redis.error_reply("ERASURE_REQUEST_MISSING") end
local request = cjson.decode(raw)
request.completedAt = request.completedAt or ARGV[2]
redis.call("SET", KEYS[1], cjson.encode(request))
redis.call("HDEL", KEYS[2], ARGV[1])
return request.completedAt`,
        2,
        tombstoneKey(did),
        PENDING_ERASURES_KEY,
        getPrivacySubjectRef(did),
        new Date().toISOString()
    );
    return { completedAt: String(result) };
};

export const readPendingDataErasurePage = async (cursor: string) => {
    const [nextCursor, values] = await tombstoneStore().hscan(
        PENDING_ERASURES_KEY,
        cursor,
        'COUNT',
        100
    );
    const owners: string[] = [];
    let unreadable = 0;
    for (let index = 0; index < values.length; index += 2) {
        try {
            const subjectRef = values[index]!;
            const envelope = JSON.parse(values[index + 1]!) as {
                iv: string;
                ciphertext: string;
                authTag: string;
            };
            const decipher = createDecipheriv(
                'aes-256-gcm',
                getPrivacyKeyMaterial().erasureRequest,
                Buffer.from(envelope.iv, 'base64')
            );
            decipher.setAAD(Buffer.from(`erasure-request:v1:${subjectRef}`));
            decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
            const did = Buffer.concat([
                decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
                decipher.final(),
            ]).toString('utf8');
            if (getPrivacySubjectRef(did) !== subjectRef) throw new Error('Erasure owner mismatch');
            owners.push(did);
        } catch {
            // Retain corrupt requests for operator recovery; don't block other owners.
            unreadable += 1;
        }
    }
    return { nextCursor, owners, unreadable };
};
export const isDataErasureRequested = async (did: string) =>
    (await tombstoneStore().exists(tombstoneKey(did))) === 1;
export const assertNoDataErasureRequested = async (did: string) => {
    if (await tombstoneStore().exists(tombstoneKey(did), PRIVACY_MAINTENANCE_KEY))
        throw new DataErasureRequestedError();
};
export const getCurrentOwnerOperation = (): OwnerOperation | undefined => {
    const scope = operations.getStore();
    if (!scope) return undefined;
    return {
        did: scope.did,
        subjectRef: scope.subjectRef,
        token: scope.token,
        signal: scope.signal,
    };
};
export const getOwnerOperationFence = () => {
    const scope = operations.getStore();
    if (!scope) return undefined;
    scope.signal.throwIfAborted();
    return {
        tombstoneKey: tombstoneKey(scope.did),
        operationsKey: activeOperationsKey(scope.did),
        token: scope.token,
    };
};
export const assertOwnerOperationActive = async (did: string): Promise<void> => {
    const scope = operations.getStore();
    if (!scope || scope.did !== did) throw new DataErasureRequestedError();
    scope.signal.throwIfAborted();
    try {
        await tombstoneStore().eval(
            `${OWNER_OPERATION_FENCE_SCRIPT}\nreturn 1`,
            3,
            tombstoneKey(did),
            activeOperationsKey(did),
            PRIVACY_MAINTENANCE_KEY,
            scope.token
        );
    } catch {
        const error = new DataErasureRequestedError();
        scope.controller.abort(error);
        throw error;
    }
};
export const withOwnerOperation = async <T>(
    did: string,
    callback: (signal: AbortSignal) => Promise<T>,
    options?: { detached?: boolean }
): Promise<T> => {
    const parent = operations.getStore();
    if (parent && parent.did !== did)
        throw new Error('Cannot nest operations for different owners');
    if (parent && !options?.detached) {
        await assertOwnerOperationActive(did);
        const result = await callback(parent.signal);
        await assertOwnerOperationActive(did);
        return result;
    }
    // A detached child cannot escape a revoked parent, but has an independent lifetime.
    if (parent) await assertOwnerOperationActive(did);
    const store = tombstoneStore();
    const token = randomUUID();
    const keys = [tombstoneKey(did), activeOperationsKey(did), PRIVACY_MAINTENANCE_KEY];
    if ((await store.eval(BEGIN_OPERATION_SCRIPT, 3, ...keys, token, OPERATION_LEASE_MS)) !== 1)
        throw new DataErasureRequestedError();
    const controller = new AbortController();
    const scope: OperationScope = {
        did,
        subjectRef: getPrivacySubjectRef(did),
        token,
        signal: controller.signal,
        controller,
    };
    let stopped = false;
    let renewing = false;
    const heartbeat = setInterval(() => {
        if (stopped || renewing || controller.signal.aborted) return;
        renewing = true;
        void store
            .eval(RENEW_OPERATION_SCRIPT, 3, ...keys, token, OPERATION_LEASE_MS)
            .then(result => {
                if (result !== 1) controller.abort(new DataErasureRequestedError());
            })
            .catch(() => controller.abort(new DataErasureRequestedError()))
            .finally(() => {
                renewing = false;
            });
    }, OPERATION_HEARTBEAT_MS);
    heartbeat.unref?.();
    return operations.run(scope, async () => {
        try {
            const result = await callback(controller.signal);
            await assertOwnerOperationActive(did);
            return result;
        } finally {
            stopped = true;
            clearInterval(heartbeat);
            // Async tasks accidentally retaining this scope must never publish after completion.
            controller.abort(new DataErasureRequestedError());
            await store.zrem(keys[1], token);
        }
    });
};
export const getActiveOwnerOperationCount = async (did: string) =>
    Number(await tombstoneStore().eval(COUNT_OPERATIONS_SCRIPT, 1, activeOperationsKey(did)));
export const registerOwnerSocket = (did: string, socket: OwnerSocket) => {
    const sockets = ownerSockets.get(did) ?? new Set<OwnerSocket>();
    sockets.add(socket);
    ownerSockets.set(did, sockets);
};
export const unregisterOwnerSocket = (did: string, socket: OwnerSocket) => {
    const sockets = ownerSockets.get(did);
    sockets?.delete(socket);
    if (sockets?.size === 0) ownerSockets.delete(did);
};
export const closeOwnerSockets = (did: string) => {
    const sockets = ownerSockets.get(did);
    ownerSockets.delete(did);
    for (const socket of sockets ?? []) {
        try {
            socket.send(JSON.stringify({ error: 'data_erasure_requested' }));
            socket.close(1008, 'Data erasure requested');
        } catch {}
    }
};
export const isDataErasureRequestedError = (error: unknown): error is DataErasureRequestedError =>
    error instanceof DataErasureRequestedError;
