import { createHash } from 'node:crypto';
import { int } from 'neo4j-driver';
import type { ShareLinkAttachment } from '@learncard/types';
import { ensureShareLinkConstraints } from '../../models/share-link-constraints';
import { failShareLink } from './errors';
import {
    enqueueCleanupJob,
    lockShare,
    readNodeProperties,
    readReservation,
    toShareLinkRecord,
    toShareLinkReservationRecord,
    normalizeNeo4jValue,
} from './helpers';
import {
    withShareLinkTransaction,
    type ShareLinkTransaction,
    type ShareLinkTransactionOptions,
} from './transaction';

export type ShareAttachmentBinding = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    contentVersion: number;
    attachmentId: string;
    chunkCount: number;
};

export const shareAttachmentObjectId = (attachmentId: string, chunkIndex: number): string =>
    `resume-pdf-${attachmentId}-${chunkIndex}`;
export const shareAttachmentTuple = (binding: ShareAttachmentBinding, chunkIndex: number) => ({
    namespace: binding.namespace,
    ownerProfileId: binding.ownerProfileId,
    shareId: binding.shareId,
    contentVersion: binding.contentVersion,
    objectId: shareAttachmentObjectId(binding.attachmentId, chunkIndex),
    operationId: binding.attachmentId,
});

const stageKey = (binding: ShareAttachmentBinding): string =>
    createHash('sha256')
        .update(
            JSON.stringify([
                binding.namespace,
                binding.ownerProfileId,
                binding.shareId,
                binding.contentVersion,
                binding.attachmentId,
            ])
        )
        .digest('hex');

const lockStage = async (tx: ShareLinkTransaction, binding: ShareAttachmentBinding) => {
    const result = await tx.run(
        `MATCH (a:ShareLinkAttachmentStage {key: $key})
        SET a.lockTick = coalesce(a.lockTick, 0) + 1 RETURN a`,
        { key: stageKey(binding) }
    );
    const props = readNodeProperties(result, 'a');
    if (props && props.chunkCount !== binding.chunkCount) {
        failShareLink('CONFLICT', 'attachment staging conflict');
    }
    return props;
};

/** Stage guard is durable; remote I/O happens only after this transaction closes. */
export const beginShareAttachmentChunk = async (
    binding: ShareAttachmentBinding,
    chunkIndex: number
): Promise<void> => {
    if (
        !Number.isInteger(binding.chunkCount) ||
        binding.chunkCount < 1 ||
        binding.chunkCount > 16 ||
        !Number.isInteger(chunkIndex) ||
        chunkIndex < 0 ||
        chunkIndex >= binding.chunkCount
    )
        failShareLink('INVALID_INPUT', 'invalid attachment chunk');
    await ensureShareLinkConstraints();
    await withShareLinkTransaction(async tx => {
        const shareProps = await lockShare(tx, binding.shareId);
        if (shareProps) {
            const share = toShareLinkRecord(shareProps);
            if (
                share.namespace !== binding.namespace ||
                share.ownerProfileId !== binding.ownerProfileId
            ) {
                failShareLink('NOT_FOUND', 'share not found');
            }
            if (
                share.status === 'stopped' ||
                !(
                    (share.status === 'pending' && binding.contentVersion === 1) ||
                    binding.contentVersion === share.contentVersion + 1 ||
                    (binding.contentVersion === share.contentVersion &&
                        share.attachmentId === binding.attachmentId &&
                        share.attachmentChunkCount === binding.chunkCount)
                )
            )
                failShareLink('CONFLICT', 'attachment version conflict');
            const pending = await readReservation(tx, binding.shareId);
            if (pending) {
                const reservation = toShareLinkReservationRecord(pending);
                if (
                    reservation.contentVersion !== binding.contentVersion ||
                    reservation.attachmentId !== binding.attachmentId ||
                    reservation.attachmentChunkCount !== binding.chunkCount
                ) {
                    failShareLink('CONFLICT', 'another publication is pending');
                }
            }
        } else if (binding.contentVersion !== 1) {
            failShareLink('NOT_FOUND', 'share not found');
        }
        // Serialize pre-create stages by owner as well as by share, so simultaneous
        // random IDs cannot exceed the bounded uncommitted storage allowance.
        const quotaKey = createHash('sha256')
            .update(JSON.stringify([binding.namespace, binding.ownerProfileId]))
            .digest('hex');
        await tx.run(
            `MERGE (q:ShareAttachmentOwnerQuota {key: $quotaKey})
            ON CREATE SET q.namespace = $namespace, q.ownerProfileId = $ownerProfileId
            SET q.lockTick = coalesce(q.lockTick, 0) + 1`,
            {
                quotaKey,
                namespace: binding.namespace,
                ownerProfileId: binding.ownerProfileId,
            }
        );
        const existing = await lockStage(tx, binding);
        if (!existing) {
            const result = await tx.run(
                `MATCH (a:ShareLinkAttachmentStage)
                WHERE a.namespace = $namespace AND a.ownerProfileId = $ownerProfileId
                    AND a.status = 'staging' AND a.expiresAt > $now
                RETURN count(a) AS count`,
                {
                    namespace: binding.namespace,
                    ownerProfileId: binding.ownerProfileId,
                    now: new Date().toISOString(),
                }
            );
            const count = normalizeNeo4jValue(result.records[0]?.get('count'));
            if (typeof count !== 'number' || count >= 8)
                failShareLink('PRECONDITION_FAILED', 'attachment staging limit reached');
        }
        await tx.run(
            `MERGE (a:ShareLinkAttachmentStage {key: $key})
            ON CREATE SET a += $props
            SET a.lockTick = coalesce(a.lockTick, 0) + 1 RETURN a`,
            {
                key: stageKey(binding),
                props: {
                    ...binding,
                    status: 'staging',
                    completedChunks: [],
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                },
            }
        );
        const stage = await lockStage(tx, binding);
        if (!stage || stage.status === 'deleted')
            failShareLink('CONFLICT', 'attachment staging conflict');
        if (
            stage.status === 'staging' &&
            typeof stage.expiresAt === 'string' &&
            stage.expiresAt <= new Date().toISOString()
        ) {
            failShareLink('CONFLICT', 'attachment staging expired');
        }
    });
};

/**
 * Record successful immutable puts even if staging expired during remote I/O.
 * This is bookkeeping, not publication authority: pin/finalize enforce expiry,
 * and maintenance cleans up an expired, uncommitted stage.
 */
export const completeShareAttachmentChunk = async (
    binding: ShareAttachmentBinding,
    chunkIndex: number
): Promise<void> => {
    await withShareLinkTransaction(async tx => {
        const stage = await lockStage(tx, binding);
        if (!stage || stage.status === 'deleted')
            failShareLink('CONFLICT', 'attachment staging conflict');
        await tx.run(
            `MATCH (a:ShareLinkAttachmentStage {key: $key})
            SET a.completedChunks = CASE WHEN $chunkIndex IN a.completedChunks THEN a.completedChunks
                ELSE a.completedChunks + $chunkIndex END`,
            { key: stageKey(binding), chunkIndex }
        );
    });
};

/** Called while the share lock is held; pins complete staged chunks to request intent. */
export const pinShareAttachment = async (
    tx: ShareLinkTransaction,
    binding: ShareAttachmentBinding,
    requestHash: string
): Promise<void> => {
    const stage = await lockStage(tx, binding);
    if (
        !stage ||
        stage.status === 'deleted' ||
        (stage.requestHash !== undefined &&
            stage.requestHash !== null &&
            stage.requestHash !== requestHash)
    ) {
        failShareLink('PRECONDITION_FAILED', 'attachment is not ready');
    }
    if (
        stage.status === 'staging' &&
        typeof stage.expiresAt === 'string' &&
        stage.expiresAt <= new Date().toISOString()
    ) {
        failShareLink('PRECONDITION_FAILED', 'attachment staging expired');
    }
    const completed = stage.completedChunks;
    if (
        !Array.isArray(completed) ||
        !Array.from({ length: binding.chunkCount }, (_, index) => index).every(index =>
            completed.includes(index)
        )
    )
        failShareLink('PRECONDITION_FAILED', 'attachment is incomplete');
    await tx.run(
        `MATCH (a:ShareLinkAttachmentStage {key: $key}) SET a.status = 'pinned',
        a.requestHash = $requestHash`,
        { key: stageKey(binding), requestHash }
    );
};

export const verifyPinnedShareAttachment = async (
    tx: ShareLinkTransaction,
    binding: ShareAttachmentBinding,
    requestHash: string
): Promise<void> => {
    const stage = await lockStage(tx, binding);
    if (!stage || stage.status !== 'pinned' || stage.requestHash !== requestHash) {
        failShareLink('PRECONDITION_FAILED', 'attachment is not ready');
    }
};

/** Queues only exact tuples, after withdrawing graph authority to commit those bytes. */
export const queueShareAttachmentCleanup = async (
    tx: ShareLinkTransaction,
    binding: ShareAttachmentBinding,
    reason: 'superseded' | 'abandoned' | 'stopped',
    now: string
): Promise<void> => {
    const stage = await lockStage(tx, binding);
    if (stage)
        await tx.run(`MATCH (a:ShareLinkAttachmentStage {key: $key}) SET a.status = 'deleted'`, {
            key: stageKey(binding),
        });
    for (let chunkIndex = 0; chunkIndex < binding.chunkCount; chunkIndex++) {
        const tuple = shareAttachmentTuple(binding, chunkIndex);
        await enqueueCleanupJob(tx, { ...tuple, objectRef: tuple.objectId, reason, now });
    }
};

/** Refuses active or in-flight assets; a tombstoned stage can never be repinned. */
export const deleteUnreferencedShareAttachment = async (
    binding: ShareAttachmentBinding
): Promise<boolean> => {
    await ensureShareLinkConstraints();
    return withShareLinkTransaction(async tx => {
        const shareProps = await lockShare(tx, binding.shareId);
        if (shareProps) {
            const share = toShareLinkRecord(shareProps);
            if (
                share.namespace !== binding.namespace ||
                share.ownerProfileId !== binding.ownerProfileId
            ) {
                failShareLink('NOT_FOUND', 'share not found');
            }
            if (
                share.attachmentId === binding.attachmentId &&
                share.contentVersion === binding.contentVersion
            )
                return false;
            const props = await readReservation(tx, binding.shareId);
            const reservation = props ? toShareLinkReservationRecord(props) : null;
            if (
                reservation?.attachmentId === binding.attachmentId &&
                reservation.contentVersion === binding.contentVersion
            )
                return false;
        }
        const stage = await lockStage(tx, binding);
        if (!stage) return false;
        if (stage.status === 'pinned') return false;
        await queueShareAttachmentCleanup(tx, binding, 'abandoned', new Date().toISOString());
        return true;
    });
};

export const attachmentBindingFor = (
    scope: { namespace: string; ownerProfileId: string; shareId: string },
    contentVersion: number,
    attachment: ShareLinkAttachment
): ShareAttachmentBinding => ({
    ...scope,
    contentVersion,
    attachmentId: attachment.id,
    chunkCount: attachment.chunkCount,
});

/** Bounded periodic collection of never-committed stages after their 24-hour retry window. */
export const expireShareAttachmentStages = async (input: {
    namespace: string;
    limit?: number;
    now?: Date;
    transaction?: ShareLinkTransactionOptions;
}): Promise<number> => {
    if (!input.namespace) failShareLink('INVALID_INPUT', 'namespace is required');
    const limit = Math.max(1, Math.min(10, input.limit ?? 10));
    return withShareLinkTransaction(async tx => {
        const candidates = await tx.run(
            `MATCH (a:ShareLinkAttachmentStage)
            WHERE a.namespace = $namespace AND a.status = 'staging' AND a.expiresAt <= $now
            RETURN a ORDER BY a.expiresAt LIMIT $limit`,
            {
                namespace: input.namespace,
                now: (input.now ?? new Date()).toISOString(),
                limit: int(limit),
            }
        );
        let queued = 0;
        for (let index = 0; index < candidates.records.length; index++) {
            const props = readNodeProperties(candidates, 'a', index);
            if (!props) continue;
            const binding: ShareAttachmentBinding = {
                namespace: String(props.namespace),
                ownerProfileId: String(props.ownerProfileId),
                shareId: String(props.shareId),
                attachmentId: String(props.attachmentId),
                contentVersion: Number(props.contentVersion),
                chunkCount: Number(props.chunkCount),
            };
            await lockShare(tx, binding.shareId);
            const stage = await lockStage(tx, binding);
            const now = (input.now ?? new Date()).toISOString();
            if (
                !stage ||
                stage.status !== 'staging' ||
                typeof stage.expiresAt !== 'string' ||
                stage.expiresAt > now
            )
                continue;
            await queueShareAttachmentCleanup(tx, binding, 'abandoned', now);
            queued++;
        }
        return queued;
    }, input.transaction);
};
