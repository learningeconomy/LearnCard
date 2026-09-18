import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { ManagedTransaction } from 'neo4j-driver';
import type { InboxBatchReceipt, IssueInboxCredentialBatchItemResult } from '@learncard/types';
import { neogma } from '@instance';
import { encryptInboxCredential, decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import type { BatchItem, BatchJob, BatchReplayStore } from 'types/inbox-batch';

export const DAY = 86_400_000;
export const LEASE_MS = 360_000;

let readiness: Promise<void> | undefined;
export const ensureInboxBatchConstraints = (): Promise<void> => {
    if (!readiness) {
        readiness = (async () => {
            for (const label of [
                'InboxBatch',
                'InboxBatchItem',
                'InboxBatchIssuer',
                'InboxBatchReplay',
            ]) {
                try {
                    await neogma.queryRunner.run(
                        `CREATE CONSTRAINT ${label.toLowerCase()}_id IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`
                    );
                } catch (error) {
                    if (
                        (error as { code?: string }).code !==
                        'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists'
                    )
                        throw error;
                }
            }
            for (const query of [
                'CREATE INDEX inbox_batch_request IF NOT EXISTS FOR (b:InboxBatch) ON (b.issuer, b.requestId)',
                'CREATE INDEX inbox_batch_dispatch IF NOT EXISTS FOR (i:InboxBatchItem) ON (i.state, i.dispatchAt)',
                'CREATE INDEX inbox_batch_recovery IF NOT EXISTS FOR (i:InboxBatchItem) ON (i.state, i.leaseUntil)',
                'CREATE INDEX inbox_batch_replay_owner IF NOT EXISTS FOR (r:InboxBatchReplay) ON (r.itemId)',
                'CREATE INDEX inbox_batch_completed IF NOT EXISTS FOR (b:InboxBatch) ON (b.completedAt)',
                'CREATE INDEX inbox_batch_replay_expiry IF NOT EXISTS FOR (r:InboxBatchReplay) ON (r.expiresAt)',
            ])
                await neogma.queryRunner.run(query);
        })();
        void readiness.catch(() => {
            readiness = undefined;
        });
    }
    return readiness;
};

const transaction = async <T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> => {
    await ensureInboxBatchConstraints();
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(fn);
    } finally {
        await session.close();
    }
};

/** The issuer node serializes submission replay and quota admission in the same transaction. */
export const createBatchJob = async (input: {
    issuer: string;
    requestId?: string;
    requestHash: string;
    payload: string;
    items: { replayKey: string; duplicate: boolean }[];
    limit: number;
}): Promise<InboxBatchReceipt> => {
    const now = Date.now();
    const id = randomUUID();
    return transaction(async tx => {
        const locked = await tx.run(
            `MERGE (q:InboxBatchIssuer {id: $issuer})
            ON CREATE SET q.used = 0, q.window = $now
            SET q.lock = coalesce(q.lock, 0) + 1 RETURN q`,
            { issuer: input.issuer, now }
        );
        if (input.requestId) {
            const prior = await tx.run(
                `MATCH (b:InboxBatch {issuer: $issuer, requestId: $requestId})
                WHERE b.createdAt > $cutoff RETURN b`,
                { issuer: input.issuer, requestId: input.requestId, cutoff: now - DAY }
            );
            const batch = prior.records[0]?.get('b').properties;
            if (batch) {
                if (batch.requestHash !== input.requestHash)
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'requestId was used for a different batch.',
                    });
                return {
                    batchId: batch.id,
                    status: 'QUEUED',
                    createdAt: new Date(Number(batch.createdAt)).toISOString(),
                };
            }
        }
        const quota = locked.records[0]!.get('q').properties;
        const expired = now - Number(quota.window) >= 3_600_000;
        const used = expired ? 0 : Number(quota.used);
        if (used + input.items.length > input.limit)
            throw new TRPCError({
                code: 'TOO_MANY_REQUESTS',
                message: `${input.limit} inbox items per hour; retry after the current window expires (at most 3600 seconds).`,
            });
        await tx.run(
            `MATCH (q:InboxBatchIssuer {id: $issuer}) SET q.used = $used, q.window = $window
            CREATE (b:InboxBatch {id: $id, issuer: $issuer, createdAt: $now, requestHash: $hash, payload: $payload})
            SET b.requestId = $requestId
            WITH b UNWIND $items AS item
            CREATE (b)-[:HAS_ITEM]->(:InboxBatchItem {id: item.id, batchId: $id,
                index: item.index, replayKey: item.replayKey, duplicate: item.duplicate,
                state: 'QUEUED', attempts: 0, dispatchAt: 0})`,
            {
                issuer: input.issuer,
                id,
                now,
                used: used + input.items.length,
                window: expired ? now : Number(quota.window),
                hash: input.requestHash,
                payload: input.payload,
                requestId: input.requestId ?? null,
                items: input.items.map((item, index) => ({ ...item, index, id: `${id}:${index}` })),
            }
        );
        return { batchId: id, status: 'QUEUED', createdAt: new Date(now).toISOString() };
    });
};

export const readBatchJob = async (
    id: string,
    issuer: string
): Promise<{ job: BatchJob; items: BatchItem[] }> => {
    const result = await neogma.queryRunner.run(
        `MATCH (b:InboxBatch {id: $id, issuer: $issuer})-[:HAS_ITEM]->(i)
        RETURN b, i ORDER BY i.index`,
        { id, issuer }
    );
    if (!result.records.length) throw new TRPCError({ code: 'NOT_FOUND' });
    return {
        job: result.records[0]!.get('b').properties,
        items: result.records.map(r => r.get('i').properties),
    };
};

/** Lock before testing ownership: concurrent SQS deliveries must not both enter issuance. */
export const claimBatchItem = async (
    id: string,
    owner: string
): Promise<{ job: BatchJob; item: BatchItem } | undefined> =>
    transaction(async tx => {
        const result = await tx.run(
            `MATCH (b:InboxBatch)-[:HAS_ITEM]->(i:InboxBatchItem {id: $id})
        SET i.lock = coalesce(i.lock, 0) + 1 RETURN b, i`,
            { id }
        );
        if (!result.records.length) return;
        const item = result.records[0]!.get('i').properties as BatchItem;
        if (item.state !== 'QUEUED') return;
        await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.state = 'PROCESSING', i.phase = 'PREPARING',
        i.owner = $owner, i.leaseUntil = $lease, i.attempts = i.attempts + 1`,
            { id, owner, lease: Date.now() + LEASE_MS }
        );
        return { job: result.records[0]!.get('b').properties, item };
    });

const lockOwnedItem = async (
    tx: ManagedTransaction,
    id: string,
    owner: string
): Promise<BatchItem> => {
    const result = await tx.run(
        `MATCH (i:InboxBatchItem {id: $id}) SET i.lock = coalesce(i.lock, 0) + 1 RETURN i`,
        { id }
    );
    const item = result.records[0]?.get('i').properties as BatchItem | undefined;
    if (
        !item ||
        item.owner !== owner ||
        item.state !== 'PROCESSING' ||
        Number(item.leaseUntil) <= Date.now()
    )
        throw new Error('Inbox item lease lost');
    return item;
};

export const markBatchIssuanceStarted = async (id: string, owner: string): Promise<void> =>
    transaction(async tx => {
        await lockOwnedItem(tx, id, owner);
        await tx.run(`MATCH (i:InboxBatchItem {id: $id}) SET i.phase = 'ISSUING'`, { id });
    });

/** Adapter retains the existing request fingerprint/CAS protocol with durable, encrypted records.
 * Processing markers never expire. Only confirmed successes get the 24-hour replay expiry.
 */
export const batchReplayStore = (
    itemId: string,
    owner: string,
    replayKey: string
): BatchReplayStore => ({
    get: async (_key: string): Promise<string | null> => {
        const result = await neogma.queryRunner.run(
            `MATCH (r:InboxBatchReplay {id: $id})
            WHERE r.expiresAt IS NULL OR r.expiresAt > $now RETURN r.value AS value`,
            { id: replayKey, now: Date.now() }
        );
        const value = result.records[0]?.get('value');
        return value ? decryptInboxCredential(value) : null;
    },
    setIfAbsent: async (_key: string, value: string, _ttl: number): Promise<'OK' | null> => {
        const encrypted = await encryptInboxCredential(value);
        return transaction(async tx => {
            await lockOwnedItem(tx, itemId, owner);
            const rows = await tx.run(
                `MERGE (r:InboxBatchReplay {id: $id}) SET r.lock = coalesce(r.lock, 0) + 1 RETURN r`,
                { id: replayKey }
            );
            const replay = rows.records[0]!.get('r').properties;
            if (replay.value && (replay.expiresAt == null || Number(replay.expiresAt) > Date.now()))
                return null;
            await tx.run(
                `MATCH (r:InboxBatchReplay {id: $id}) SET r.value = $value, r.marker = $marker,
                r.itemId = $itemId, r.expiresAt = null`,
                { id: replayKey, value: encrypted, marker: value, itemId }
            );
            return 'OK';
        });
    },
    compareAndSet: async (
        _key: string,
        expected: string,
        value: string | null,
        ttl: number
    ): Promise<boolean> => {
        const encrypted = value === null ? null : await encryptInboxCredential(value);
        return transaction(async tx => {
            await lockOwnedItem(tx, itemId, owner);
            const rows = await tx.run(
                `MATCH (r:InboxBatchReplay {id: $id}) SET r.lock = coalesce(r.lock, 0) + 1 RETURN r.marker AS marker`,
                { id: replayKey }
            );
            if (rows.records[0]?.get('marker') !== expected) return false;
            if (value === null) {
                await tx.run(`MATCH (r:InboxBatchReplay {id: $id}) DELETE r`, { id: replayKey });
                // The shared helper only releases after an explicitly safe preflight failure.
                await tx.run(`MATCH (i:InboxBatchItem {id: $itemId}) SET i.phase = 'PREPARING'`, {
                    itemId,
                });
            } else {
                await tx.run(
                    `MATCH (r:InboxBatchReplay {id: $id}) SET r.value = $value,
                    r.marker = null, r.expiresAt = $expiry`,
                    { id: replayKey, value: encrypted, expiry: Date.now() + ttl * 1000 }
                );
            }
            return true;
        });
    },
});

export const finishBatchItem = async (
    id: string,
    owner: string,
    result: IssueInboxCredentialBatchItemResult
): Promise<void> => {
    const encrypted = await encryptInboxCredential(JSON.stringify(result));
    await transaction(async tx => {
        const item = await lockOwnedItem(tx, id, owner);
        const unconfirmed = !result.success && item.phase === 'ISSUING';
        const retry =
            !result.success &&
            result.error.code === 'INTERNAL_SERVER_ERROR' &&
            !unconfirmed &&
            Number(item.attempts) < 5;
        if (retry)
            await tx.run(
                `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NOT NULL DELETE r`,
                { id }
            );
        await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.state = $state, i.result = $result,
            i.owner = null, i.leaseUntil = null, i.dispatchAt = 0`,
            {
                id,
                state: retry ? 'QUEUED' : unconfirmed ? 'NEEDS_RECONCILIATION' : 'COMPLETED',
                result: retry ? null : encrypted,
            }
        );
        await tx.run(
            `MATCH (b:InboxBatch)-[:HAS_ITEM]->(i:InboxBatchItem {id: $id})
            WHERE NOT EXISTS { MATCH (b)-[:HAS_ITEM]->(pending) WHERE pending.state <> 'COMPLETED' }
            SET b.completedAt = $now REMOVE b.payload`,
            { id, now: Date.now() }
        );
    });
};

/** Claim dispatch leases before publishing. A lost publish acknowledgement causes a safe duplicate. */
export const takeInboxDispatches = async (): Promise<string[]> =>
    transaction(async tx => {
        const result = await tx.run(
            `MATCH (i:InboxBatchItem) WHERE i.state = 'QUEUED' AND i.dispatchAt < $now
        WITH i LIMIT 1000 SET i.lock = coalesce(i.lock, 0) + 1
        WITH i WHERE i.state = 'QUEUED' AND i.dispatchAt < $now
        SET i.dispatchAt = $next RETURN i.id AS id`,
            { now: Date.now(), next: Date.now() + 60_000 }
        );
        return result.records.map(r => r.get('id'));
    });

export const acknowledgeInboxDispatches = async (ids: string[]): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (i:InboxBatchItem) WHERE i.id IN $ids AND i.state = 'QUEUED'
        SET i.dispatchAt = $next`,
        { ids, next: Date.now() + 1_800_000 }
    );
};

/** Poison messages become visible terminal outcomes instead of disappearing into the DLQ. */
export const deadLetterBatchItem = async (id: string): Promise<void> =>
    transaction(async tx => {
        const rows = await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.lock = coalesce(i.lock, 0) + 1 RETURN i`,
            { id }
        );
        const item = rows.records[0]?.get('i').properties as BatchItem | undefined;
        if (!item || ['COMPLETED', 'NEEDS_RECONCILIATION'].includes(item.state)) return;
        if (item.state === 'PROCESSING' && Number(item.leaseUntil) > Date.now())
            throw new Error('Inbox item still has an active worker');
        const uncertain = item.phase === 'ISSUING';
        const replay = await tx.run(
            `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NULL RETURN r.value AS value`,
            { id }
        );
        const saved = replay.records[0]?.get('value');
        if (!uncertain)
            await tx.run(
                `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NOT NULL DELETE r`,
                { id }
            );
        await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.state = $state, i.owner = null, i.leaseUntil = null, i.result = $result`,
            {
                id,
                state: uncertain && !saved ? 'NEEDS_RECONCILIATION' : 'COMPLETED',
                result: saved ?? null,
            }
        );
    });

/** Expired issuance leases are never reissued. Preparation can safely start again. */
export const recoverInboxJobs = async (): Promise<void> => {
    await transaction(async tx => {
        const rows = await tx.run(
            `MATCH (i:InboxBatchItem) WHERE i.state = 'PROCESSING' AND i.leaseUntil < $now
            WITH i LIMIT 100 SET i.lock = coalesce(i.lock, 0) + 1
            WITH i WHERE i.state = 'PROCESSING' AND i.leaseUntil < $now RETURN i`,
            { now: Date.now() }
        );
        for (const row of rows.records) {
            const item = row.get('i').properties as BatchItem;
            // A persisted success is authoritative even if the worker lost its completion reply.
            const replay = await tx.run(
                `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NULL RETURN r.value AS value`,
                { id: item.id }
            );
            const saved = replay.records[0]?.get('value');
            const state = saved
                ? 'COMPLETED'
                : item.phase === 'ISSUING'
                  ? 'NEEDS_RECONCILIATION'
                  : Number(item.attempts) >= 5
                    ? 'COMPLETED'
                    : 'QUEUED';
            if (item.phase !== 'ISSUING')
                await tx.run(
                    `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NOT NULL DELETE r`,
                    { id: item.id }
                );
            await tx.run(
                `MATCH (i:InboxBatchItem {id: $id}) SET i.state = $state, i.owner = null,
                i.leaseUntil = null, i.dispatchAt = 0, i.result = $result`,
                { id: item.id, state, result: saved ?? null }
            );
        }
        await tx.run(
            `MATCH (b:InboxBatch) WHERE b.completedAt IS NULL
            AND NOT EXISTS { MATCH (b)-[:HAS_ITEM]->(i) WHERE i.state <> 'COMPLETED' }
            SET b.completedAt = $now REMOVE b.payload`,
            { now: Date.now() }
        );
        await tx.run(
            `MATCH (b:InboxBatch) WHERE b.completedAt < $cutoff WITH b LIMIT 100
                MATCH (b)-[:HAS_ITEM]->(i) DETACH DELETE i, b`,
            { cutoff: Date.now() - 30 * DAY }
        );
        await tx.run(
            `MATCH (r:InboxBatchReplay) WHERE r.expiresAt < $now WITH r LIMIT 1000 DELETE r`,
            {
                now: Date.now(),
            }
        );
    });
};
