import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { ManagedTransaction } from 'neo4j-driver';
import type { InboxBatchReceipt, IssueInboxCredentialBatchItemResult } from '@learncard/types';
import { neogma } from '@instance';
import { encryptInboxCredential, decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import type { BatchItem, BatchJob, BatchReplayStore, InboxDispatchLease } from 'types/inbox-batch';
import { getInboxBatchState } from '@helpers/inbox-batch-status.helpers';

export const DAY = 86_400_000;
export const LEASE_MS = 360_000;
const CLEANUP_MARGIN_MS = 5_000;

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
    items: { replayKey: string; duplicate: boolean; correlation?: string }[];
    limit: number;
}): Promise<InboxBatchReceipt> => {
    const now = Date.now();
    const id = randomUUID();
    return transaction(async tx => {
        // The property write acquires Neo4j's exclusive node lock until commit. Concurrent
        // admissions therefore cannot read quota between this statement and the update below.
        const locked = await tx.run(
            `MERGE (q:InboxBatchIssuer {id: $issuer})
            ON CREATE SET q.used = 0, q.window = $now
            SET q.lock = coalesce(q.lock, 0) + 1 RETURN q`,
            { issuer: input.issuer, now }
        );
        if (input.requestId) {
            // Creation atomically creates at least one HAS_ITEM relationship. Requiring it here
            // prevents a structurally incomplete batch from being returned as a valid replay.
            const prior = await tx.run(
                `MATCH (b:InboxBatch {issuer: $issuer, requestId: $requestId})
                WHERE b.createdAt > $cutoff
                MATCH (b)-[:HAS_ITEM]->(i:InboxBatchItem) RETURN b, collect(i.state) AS states`,
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
                    status: getInboxBatchState(prior.records[0]!.get('states')),
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
                correlation: item.correlation,
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
 * Processing markers have no expiry. Orphaned internal markers are removed after job retention;
 * client-keyed markers remain blocked. Only confirmed successes get the 24-hour replay expiry.
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

/** Terminal items no longer need the original credential payload, including uncertain outcomes.
 * Client-keyed replay reservations are separate nodes and survive the 30-day job retention period.
 */
const finalizeSettledBatch = async (tx: ManagedTransaction, id: string): Promise<void> => {
    await tx.run(
        `MATCH (b:InboxBatch {id: $id}) SET b.lock = coalesce(b.lock, 0) + 1
        WITH b WHERE NOT EXISTS {
            MATCH (b)-[:HAS_ITEM]->(i) WHERE i.state IN ['QUEUED', 'PROCESSING']
        }
        SET b.completedAt = coalesce(b.completedAt, $now) REMOVE b.payload`,
        { id, now: Date.now() }
    );
};

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
            (result.error.code === 'INTERNAL_SERVER_ERROR' ||
                result.error.reason === 'IN_PROGRESS') &&
            !unconfirmed &&
            Number(item.attempts) < 5;
        if (retry)
            await tx.run(
                `MATCH (r:InboxBatchReplay {itemId: $id}) WHERE r.marker IS NOT NULL DELETE r`,
                { id }
            );
        await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.state = $state, i.result = $result,
            i.owner = null, i.leaseUntil = null, i.dispatchAt = $dispatchAt`,
            {
                id,
                state: retry ? 'QUEUED' : unconfirmed ? 'NEEDS_RECONCILIATION' : 'COMPLETED',
                result: retry ? null : encrypted,
                dispatchAt:
                    retry && !result.success && result.error.reason === 'IN_PROGRESS'
                        ? Date.now() + Math.min(60_000, 2_000 * 2 ** (Number(item.attempts) - 1))
                        : 0,
            }
        );
        await finalizeSettledBatch(tx, item.batchId);
    });
};

/** Claim dispatch leases before publishing. A lost publish acknowledgement causes a safe duplicate. */
export const takeInboxDispatches = async (): Promise<InboxDispatchLease[]> =>
    transaction(async tx => {
        const result = await tx.run(
            `MATCH (i:InboxBatchItem) WHERE i.state = 'QUEUED' AND i.dispatchAt < $now
        WITH i LIMIT 1000 SET i.lock = coalesce(i.lock, 0) + 1
        WITH i WHERE i.state = 'QUEUED' AND i.dispatchAt < $now
        SET i.dispatchAt = $next RETURN i.id AS id, i.dispatchAt AS dispatchAt`,
            { now: Date.now(), next: Date.now() + 60_000 }
        );
        return result.records.map(r => ({
            id: r.get('id'),
            dispatchAt: Number(r.get('dispatchAt')),
        }));
    });

export const acknowledgeInboxDispatches = async (leases: InboxDispatchLease[]): Promise<void> => {
    await neogma.queryRunner.run(
        `UNWIND $leases AS lease MATCH (i:InboxBatchItem {id: lease.id})
        SET i.lock = coalesce(i.lock, 0) + 1
        WITH i, lease WHERE i.state = 'QUEUED' AND i.dispatchAt = lease.dispatchAt
        SET i.dispatchAt = $next`,
        { leases, next: Date.now() + 1_800_000 }
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
        await finalizeSettledBatch(tx, item.batchId);
    });

/** Recover bounded groups in short transactions without holding locks across the whole maintenance run. */
export const recoverInboxJobs = async (deadline = Date.now() + 20_000): Promise<void> => {
    await ensureInboxBatchConstraints();
    if (Date.now() >= deadline) return;
    const expired = await neogma.queryRunner.run(
        `MATCH (i:InboxBatchItem) WHERE i.state = 'PROCESSING' AND i.leaseUntil < $now
        RETURN i.id AS id LIMIT 100`,
        { now: Date.now() }
    );
    for (const row of expired.records) {
        if (Date.now() >= deadline) break;
        await transaction(async tx => {
            const rows = await tx.run(
                `MATCH (i:InboxBatchItem {id: $id})
                SET i.lock = coalesce(i.lock, 0) + 1
                WITH i WHERE i.state = 'PROCESSING' AND i.leaseUntil < $now RETURN i`,
                { id: row.get('id'), now: Date.now() }
            );
            const item = rows.records[0]?.get('i').properties as BatchItem | undefined;
            if (!item) return;
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
            await finalizeSettledBatch(tx, item.batchId);
        });
    }
    if (Date.now() < deadline) {
        // Also finalize older terminal batches that predate immediate terminal cleanup.
        const settled = await neogma.queryRunner.run(
            `MATCH (b:InboxBatch) WHERE b.completedAt IS NULL
            AND NOT EXISTS { MATCH (b)-[:HAS_ITEM]->(i) WHERE i.state IN ['QUEUED', 'PROCESSING'] }
            RETURN b.id AS id LIMIT 100`
        );
        for (const row of settled.records) {
            if (Date.now() >= deadline) break;
            await transaction(tx => finalizeSettledBatch(tx, row.get('id')));
        }
    }

    // Leave room for each transaction to finish; checking only for a future deadline can
    // start a large delete immediately before Lambda shutdown. Recheck between steps.
    if (deadline - Date.now() > CLEANUP_MARGIN_MS)
        await transaction(async tx => {
            await tx.run(
                `MATCH (b:InboxBatch) WHERE b.completedAt < $cutoff WITH b LIMIT 25
                MATCH (b)-[:HAS_ITEM]->(i) DETACH DELETE i, b`,
                { cutoff: Date.now() - 30 * DAY }
            );
        });
    if (deadline - Date.now() > CLEANUP_MARGIN_MS)
        await transaction(async tx => {
            await tx.run(
                `MATCH (r:InboxBatchReplay) WHERE r.expiresAt < $now WITH r LIMIT 1000 DELETE r`,
                { now: Date.now() }
            );
        });
    if (deadline - Date.now() > CLEANUP_MARGIN_MS)
        await transaction(async tx => {
            // Internal keys cannot be supplied by clients, and messages cannot claim a deleted
            // item. Client-keyed reservations must continue blocking uncertain reissuance.
            await tx.run(
                `MATCH (r:InboxBatchReplay)
                WHERE r.id STARTS WITH 'internal:' AND r.expiresAt IS NULL
                AND NOT EXISTS { MATCH (i:InboxBatchItem) WHERE i.id = r.itemId }
                WITH r LIMIT 1000 DELETE r`
            );
        });
};
