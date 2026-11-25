import { createHash, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import type { ManagedTransaction } from 'neo4j-driver';
import type { InboxBatchReceipt, IssueInboxCredentialBatchItemResult } from '@learncard/types';
import { neogma } from '@instance';
import { encryptInboxCredential, decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import type { BatchItem, BatchJob, BatchReplayStore, InboxDispatchLease } from 'types/inbox-batch';
import { getInboxBatchState } from '@helpers/inbox-batch-status.helpers';
import { ensureInboxBatchConstraints } from './schema';

export const DAY = 86_400_000;
export const LEASE_MS = 360_000;
const CLEANUP_MARGIN_MS = 5_000;

export { ensureInboxBatchConstraints } from './schema';

/**
 * A request id that already holds another payload. Typed so that a caller which derives the
 * request id itself can recognise this refusal without reading its message.
 */
export class InboxBatchRequestIdConflict extends TRPCError {
    constructor() {
        super({ code: 'CONFLICT', message: 'requestId was used for a different batch.' });
    }
}

/** A step by a worker that no longer holds its item: recovery took an expired lease, or a
 * refusal was recorded on the item. Typed so that a caller can tell it from a failure.
 */
export class InboxItemLeaseLost extends Error {
    constructor() {
        super('Inbox item lease lost');
    }
}

/** A keyed single request: the identity its durable decision is recorded on. */
export type BatchRequestIdentity = { issuer: string; requestId: string; requestHash: string };

/** An item of a keyed single request that reached its checkpoint after the request was decided
 * for every job admitted up to its own: another item passed first, or a call was answered.
 */
export class InboxBatchRequestDecided extends TRPCError {
    constructor() {
        super({
            code: 'CONFLICT',
            message: 'This request was already decided by another attempt of its idempotency key.',
        });
    }
}

const requestDecisionId = (request: BatchRequestIdentity): string =>
    createHash('sha256')
        .update(JSON.stringify([request.issuer, request.requestId, request.requestHash]))
        .digest('hex');

/** The REQUEST lock: the property write holds the decision node exclusively until commit.
 * Lock order everywhere: issuer, request, item, replay, job. No node means undecided.
 */
const lockRequestDecision = async (
    tx: ManagedTransaction,
    request: BatchRequestIdentity
): Promise<{ id: string; winner: string | null; decidedSeq: number | null }> => {
    const id = requestDecisionId(request);
    const rows = await tx.run(
        `MERGE (d:InboxBatchRequest {id: $id})
        ON CREATE SET d.issuer = $issuer, d.requestId = $requestId,
            d.requestHash = $requestHash, d.admitted = 0
        SET d.lock = coalesce(d.lock, 0) + 1 RETURN d`,
        { id, ...request }
    );
    const decision = rows.records[0]!.get('d').properties;
    return {
        id,
        winner: decision.winner ?? null,
        decidedSeq: decision.decidedSeq == null ? null : Number(decision.decidedSeq),
    };
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
    /** Encrypted outcome for waiting items of strictly older jobs of this request. */
    superseded?: string;
}): Promise<InboxBatchReceipt> => {
    const now = Date.now();
    const id = randomUUID();
    return transaction(async tx => {
        // The jobs of one request are ordered by (createdAt, id), which never change, and only
        // the newest may issue. Retiring in the transaction that selected the job, under the
        // issuer lock, means two admissions can never retire each other's job. Each item is
        // decided again under its own lock: one a worker has claimed is left to that worker,
        // which retires it at its next claim (hasNewerBatchJob).
        const retireOlder = async (selected: string, createdAt: number): Promise<void> => {
            if (!input.requestId || !input.superseded) return;
            const retired = await tx.run(
                `MATCH (b:InboxBatch {issuer: $issuer, requestId: $requestId, requestHash: $hash})
                WHERE b.createdAt < $createdAt OR (b.createdAt = $createdAt AND b.id < $selected)
                MATCH (b)-[:HAS_ITEM]->(i:InboxBatchItem) WHERE i.state = 'QUEUED'
                WITH b, i LIMIT 100 SET i.lock = coalesce(i.lock, 0) + 1
                WITH b, i WHERE i.state = 'QUEUED'
                SET i.state = 'COMPLETED', i.result = $result, i.owner = null,
                    i.leaseUntil = null, i.dispatchAt = 0
                RETURN DISTINCT b.id AS id`,
                {
                    issuer: input.issuer,
                    requestId: input.requestId,
                    hash: input.requestHash,
                    selected,
                    createdAt,
                    result: input.superseded,
                }
            );
            for (const record of retired.records) await finalizeSettledBatch(tx, record.get('id'));
        };
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
                MATCH (b)-[:HAS_ITEM]->(i:InboxBatchItem)
                RETURN b, collect(i.state) AS states ORDER BY b.createdAt DESC, b.id DESC LIMIT 1`,
                { issuer: input.issuer, requestId: input.requestId, cutoff: now - DAY }
            );
            const batch = prior.records[0]?.get('b').properties;
            if (batch) {
                if (batch.requestHash !== input.requestHash)
                    throw new InboxBatchRequestIdConflict();
                await retireOlder(batch.id, Number(batch.createdAt));
                return {
                    batchId: batch.id,
                    status: getInboxBatchState(prior.records[0]!.get('states')),
                    createdAt: new Date(Number(batch.createdAt)).toISOString(),
                };
            }
        }
        // Keyed single calls only. REQUEST lock, taken after the issuer lock: the new job's
        // ordinal is counted where every decision of this request is written, so "admitted
        // before the decision" is a fact of that lock and not of a clock.
        let requestSeq: number | null = null;
        if (input.requestId && input.superseded) {
            const decision = await lockRequestDecision(tx, {
                issuer: input.issuer,
                requestId: input.requestId,
                requestHash: input.requestHash,
            });
            const counted = await tx.run(
                `MATCH (d:InboxBatchRequest {id: $id}) SET d.admitted = coalesce(d.admitted, 0) + 1
                RETURN d.admitted AS seq`,
                { id: decision.id }
            );
            requestSeq = Number(counted.records[0]!.get('seq'));
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
            SET b.requestId = $requestId, b.requestSeq = $requestSeq
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
                requestSeq,
                items: input.items.map((item, index) => ({ ...item, index, id: `${id}:${index}` })),
            }
        );
        await retireOlder(id, now);
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

/** Most waiting items one keyed call looks at. Admission leaves one QUEUED item per request
 * and a held older item ends at its next claim, so this is a backstop, not a working size.
 */
export const OUTSTANDING_ITEMS_LIMIT = 20;

/** Read-only: the items of this request (same payload fingerprint) that could still be issued,
 * oldest job first, whatever the age of the job. createBatchJob looks one day back when it
 * decides whether to admit, but a QUEUED item has no age limit and stays eligible for dispatch.
 */
export const readOutstandingBatchItems = async (
    issuer: string,
    requestId: string,
    requestHash: string
): Promise<{ batchId: string; itemId: string; state: BatchItem['state'] }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (b:InboxBatch {issuer: $issuer, requestId: $requestId, requestHash: $requestHash})
            -[:HAS_ITEM]->(i:InboxBatchItem)
        WHERE i.state IN ['QUEUED', 'PROCESSING']
        RETURN b.id AS batchId, i.id AS itemId, i.state AS state
        ORDER BY b.createdAt, b.id LIMIT toInteger($limit)`,
        { issuer, requestId, requestHash, limit: OUTSTANDING_ITEMS_LIMIT }
    );
    return result.records.map(record => ({
        batchId: String(record.get('batchId')),
        itemId: String(record.get('itemId')),
        state: record.get('state') as BatchItem['state'],
    }));
};

/** True once a strictly newer job of the same request exists: (createdAt, id) is the order.
 * Both are immutable and jobs are only added, so the answer never goes back to false while
 * that job is kept. Only request ids in the given namespace are looked at.
 */
export const hasNewerBatchJob = async (batchId: string, namespace: string): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (b:InboxBatch {id: $batchId}) WHERE b.requestId STARTS WITH $namespace
        MATCH (n:InboxBatch {issuer: b.issuer, requestId: b.requestId, requestHash: b.requestHash})
        WHERE n.createdAt > b.createdAt OR (n.createdAt = b.createdAt AND n.id > b.id)
        RETURN n.id AS id LIMIT 1`,
        { batchId, namespace }
    );
    return result.records.length > 0;
};

/** Lock before testing ownership: concurrent SQS deliveries must not both enter issuance. */
export const claimBatchItem = async (
    id: string,
    owner: string,
    respectDispatchAt = false
): Promise<{ job: BatchJob; item: BatchItem } | undefined> =>
    transaction(async tx => {
        const result = await tx.run(
            `MATCH (b:InboxBatch)-[:HAS_ITEM]->(i:InboxBatchItem {id: $id})
        SET i.lock = coalesce(i.lock, 0) + 1 RETURN b, i`,
            { id }
        );
        if (!result.records.length) return;
        const item = result.records[0]!.get('i').properties as BatchItem & { dispatchAt?: number };
        if (item.state !== 'QUEUED') return;
        // SQS workers already have a dispatch lease; only direct HTTP attempts
        // must wait for the persisted schedule rather than spending retry attempts.
        if (respectDispatchAt && Number(item.dispatchAt ?? 0) > Date.now()) return;
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
        throw new InboxItemLeaseLost();
    return item;
};

/** The issuance checkpoint. For an item of a keyed single request it is also where the request
 * is decided: one conditional write under the REQUEST lock (then the item lock), which every
 * item of the request takes here and every answering call takes in closeBatchRequest. An item
 * whose job the decision already covers loses, unless it is the winner itself; otherwise it
 * wins and the decision covers every job admitted so far.
 */
export const markBatchIssuanceStarted = async (
    id: string,
    owner: string,
    request?: BatchRequestIdentity & { seq: number }
): Promise<void> =>
    transaction(async tx => {
        const decision = request ? await lockRequestDecision(tx, request) : undefined;
        await lockOwnedItem(tx, id, owner);
        if (request && decision) {
            const covered = decision.decidedSeq !== null && request.seq <= decision.decidedSeq;
            if (covered && decision.winner !== id) throw new InboxBatchRequestDecided();
            await tx.run(
                `MATCH (d:InboxBatchRequest {id: $decision})
                SET d.winner = $id, d.decidedSeq = d.admitted`,
                { decision: decision.id, id }
            );
        }
        await tx.run(`MATCH (i:InboxBatchItem {id: $id}) SET i.phase = 'ISSUING'`, { id });
    });

/** A keyed call that answers from the key's record decides its request for every job admitted
 * so far: none of their items may pass the checkpoint afterwards, however many there are and
 * whenever they run. One conditional write under the REQUEST lock, the lock of the checkpoint.
 * A refusal is not written while an item of the request is past its checkpoint (false: that
 * delivery is in flight). Nothing is stored for a request that has no job.
 */
export const closeBatchRequest = async (
    request: BatchRequestIdentity,
    refusal: boolean
): Promise<boolean> =>
    transaction(async tx => {
        const jobs = await tx.run(
            `MATCH (b:InboxBatch {issuer: $issuer, requestId: $requestId})
            WHERE b.requestHash = $requestHash RETURN b.id AS id LIMIT 1`,
            request
        );
        if (!jobs.records.length) return true;
        const decision = await lockRequestDecision(tx, request);
        if (refusal && decision.winner) {
            const issuing = await tx.run(
                `MATCH (i:InboxBatchItem {id: $id})
                WHERE i.state = 'PROCESSING' AND i.phase = 'ISSUING' RETURN i.id AS id`,
                { id: decision.winner }
            );
            if (issuing.records.length) return false;
        }
        await tx.run(
            `MATCH (d:InboxBatchRequest {id: $id}) SET d.winner = null, d.decidedSeq = d.admitted`,
            { id: decision.id }
        );
        return true;
    });

/** Adapter retains the existing request fingerprint/CAS protocol with durable, encrypted records.
 * Processing markers have no expiry. Orphaned internal markers are removed after job retention;
 * client-keyed markers remain blocked. Only confirmed successes get the 24-hour replay expiry.
 */
export const readBatchReplay = async (replayKey: string): Promise<string | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (r:InboxBatchReplay {id: $id})
         WHERE r.expiresAt IS NULL OR r.expiresAt > $now RETURN r.value AS value`,
        { id: replayKey, now: Date.now() }
    );
    const value = result.records[0]?.get('value');
    return value ? decryptInboxCredential(value) : null;
};

export const batchReplayStore = (
    itemId: string,
    owner: string,
    replayKey: string,
    /** Keyed single requests only: a stored receipt extends the decision of this request, and
     * a release by the item that holds it gives it back. */
    request?: BatchRequestIdentity & { seq: number }
): BatchReplayStore => ({
    get: async (_key: string): Promise<string | null> => readBatchReplay(replayKey),
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
            // REQUEST lock first (request, item, replay): a receipt also covers a job admitted
            // between this item's checkpoint and this write; a release gives the decision back.
            const decision = request ? await lockRequestDecision(tx, request) : undefined;
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
                // Nothing was delivered and the key is free again in this same transaction. An
                // item that holds the decision (its checkpoint committed) gives it back with
                // the key: its own job and every later one are undecided again; earlier jobs
                // stay decided, as they were before it won. Any other item changes nothing.
                if (decision && request)
                    await tx.run(
                        `MATCH (d:InboxBatchRequest {id: $id}) WHERE d.winner = $itemId
                        SET d.winner = null, d.decidedSeq =
                            CASE WHEN $seq > 0 THEN toInteger($seq) - 1 ELSE null END`,
                        { id: decision.id, itemId, seq: request.seq }
                    );
            } else {
                await tx.run(
                    `MATCH (r:InboxBatchReplay {id: $id}) SET r.value = $value,
                    r.marker = null, r.expiresAt = $expiry`,
                    { id: replayKey, value: encrypted, expiry: Date.now() + ttl * 1000 }
                );
                // The stored receipt is this item's own proof of delivery, so it covers every
                // job admitted so far whoever the decision names by now: a call that replayed
                // an older receipt may have cleared the winner since the checkpoint.
                if (decision)
                    await tx.run(
                        `MATCH (d:InboxBatchRequest {id: $id}) SET d.decidedSeq = d.admitted`,
                        { id: decision.id }
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

/** Records an already known outcome on an item nobody has claimed. No owner lease is needed
 * because nothing is issued here; the lock bump serialises this with claimBatchItem, which
 * starts with the same statement. Only an unowned QUEUED item is written: a PROCESSING item
 * is left to its owner, whose reserve step meets the same replay record.
 */
export const settleQueuedBatchItem = async (
    id: string,
    result: IssueInboxCredentialBatchItemResult
): Promise<boolean> => {
    const encrypted = await encryptInboxCredential(JSON.stringify(result));
    return transaction(async tx => {
        const locked = await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.lock = coalesce(i.lock, 0) + 1 RETURN i`,
            { id }
        );
        const item = locked.records[0]?.get('i').properties as BatchItem | undefined;
        if (item?.state !== 'QUEUED') return false;
        await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.state = 'COMPLETED', i.result = $encrypted,
            i.owner = null, i.leaseUntil = null, i.dispatchAt = 0`,
            { id, encrypted }
        );
        await finalizeSettledBatch(tx, item.batchId);
        return true;
    });
};

/** Records a refusal on a waiting item so that it can no longer issue: an unowned QUEUED item,
 * and also one a worker has claimed but that has not reserved the key yet. One guarded statement
 * under the item lock decides it, so it is serialised with claimBatchItem and with every step of
 * an owner, including its reservation: each takes the same lock and then tests ownership.
 * Clearing the owner fences that worker as recovery does: its next step fails with a lost lease.
 * Returns false only for a claimed item that holds a replay record: it is left to its worker,
 * and the key's record is then that item's own.
 */
export const rejectWaitingBatchItem = async (
    id: string,
    result: IssueInboxCredentialBatchItemResult
): Promise<boolean> => {
    const encrypted = await encryptInboxCredential(JSON.stringify(result));
    return transaction(async tx => {
        const rejected = await tx.run(
            `MATCH (i:InboxBatchItem {id: $id}) SET i.lock = coalesce(i.lock, 0) + 1
            WITH i WHERE i.state = 'QUEUED' OR (i.state = 'PROCESSING'
                AND NOT EXISTS { MATCH (r:InboxBatchReplay {itemId: i.id}) })
            SET i.state = 'COMPLETED', i.result = $encrypted, i.owner = null,
                i.leaseUntil = null, i.dispatchAt = 0
            RETURN i.batchId AS batchId`,
            { id, encrypted }
        );
        const batchId = rejected.records[0]?.get('batchId');
        if (batchId) {
            await finalizeSettledBatch(tx, batchId);
            return true;
        }
        const left = await tx.run(`MATCH (i:InboxBatchItem {id: $id}) RETURN i.state AS state`, {
            id,
        });
        return left.records[0]?.get('state') !== 'PROCESSING';
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
            // A request's decision is kept while any job of the request exists: an item that
            // is still outstanding keeps its job, so the decision outlives it. Decided again
            // under the REQUEST lock, which admission holds while it creates a job.
            await tx.run(
                `MATCH (d:InboxBatchRequest) WHERE NOT EXISTS {
                    MATCH (b:InboxBatch {issuer: d.issuer, requestId: d.requestId})
                    WHERE b.requestHash = d.requestHash }
                WITH d LIMIT 1000 SET d.lock = coalesce(d.lock, 0) + 1
                WITH d WHERE NOT EXISTS {
                    MATCH (b:InboxBatch {issuer: d.issuer, requestId: d.requestId})
                    WHERE b.requestHash = d.requestHash }
                DELETE d`
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
