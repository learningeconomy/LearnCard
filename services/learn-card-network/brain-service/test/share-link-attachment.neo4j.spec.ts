import { randomBytes, randomUUID } from 'node:crypto';
import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest';
import { neogma } from '@instance';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';
import {
    beginShareAttachmentChunk,
    completeShareAttachmentChunk,
    deleteUnreferencedShareAttachment,
    expireShareAttachmentStages,
    shareAttachmentObjectId,
    type ShareAttachmentBinding,
} from '../src/accesslayer/share-link/attachment';
import {
    reserveCreate,
    reserveReplacement,
    finalizeReservation,
    revokeShareLink,
    abandonReservation,
    getShareLink,
    listCleanupJobsForShare,
} from '../src/accesslayer/share-link';
import { contentBinding } from './helpers/share-link-fixtures';
import type { ShareLinkReservationRecord } from '../src/accesslayer/share-link/types';

// Only this suite's random namespace is cleaned; no shared/user graph is touched.
const namespace = `attachment-tests-${randomUUID()}`;
const clear = async (): Promise<void> => {
    await neogma.queryRunner.run('MATCH (n) WHERE n.namespace = $namespace DETACH DELETE n', {
        namespace,
    });
};
beforeAll(async () => {
    await ensureShareLinkConstraints();
});
beforeEach(clear);
afterAll(async () => {
    await clear();
    await neogma.queryRunner.getDriver().close();
});

const binding = (count = 2, owner = 'owner'): ShareAttachmentBinding => ({
    namespace,
    ownerProfileId: owner,
    shareId: randomBytes(16).toString('base64url'),
    contentVersion: 1,
    attachmentId: randomUUID(),
    chunkCount: count,
});
const stage = async (
    value: ShareAttachmentBinding,
    indices = Array.from({ length: value.chunkCount }, (_, i) => i)
) => {
    for (const index of indices) {
        await beginShareAttachmentChunk(value, index);
        await completeShareAttachmentChunk(value, index);
    }
};
const createInput = (value: ShareAttachmentBinding) => ({
    ...value,
    clientRequestId: randomUUID(),
    title: 'Synthetic resume',
    selectedCount: 1,
    content: contentBinding(value.attachmentId),
    attachment: { id: value.attachmentId, chunkCount: value.chunkCount },
    requestHash: 'a'.repeat(64),
    leaseOwner: 'worker',
});
const reserve = async (value: ShareAttachmentBinding): Promise<ShareLinkReservationRecord> => {
    const result = await reserveCreate(createInput(value));
    if (result.outcome !== 'reserved') throw new Error('expected reserved operation');
    return result.reservation;
};
const finish = async (record: ShareLinkReservationRecord, verified = true) =>
    finalizeReservation({
        namespace,
        ownerProfileId: record.ownerProfileId,
        shareId: record.shareId,
        operationId: record.operationId,
        objectRef: record.objectRef,
        generation: record.generation,
        leaseOwner: record.leaseOwner,
        verifiedContentHash: record.contentHash ?? undefined,
        verifiedAttachmentId: verified ? (record.attachmentId ?? undefined) : undefined,
    });

describe('managed attachment graph fences', () => {
    it('refuses incomplete staged PDFs and rolls back the pending share', async () => {
        const value = binding();
        await stage(value, [0]);
        await expect(reserve(value)).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
        expect(
            await getShareLink({
                shareId: value.shareId,
                namespace,
                ownerProfileId: value.ownerProfileId,
            })
        ).toBeNull();
        await completeShareAttachmentChunk(value, 1);
        const pending = await reserve(value);
        await expect(finish(pending, false)).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
        const committed = await finish(pending);
        expect(committed.share.attachmentId).toBe(value.attachmentId);
        expect(committed.share.attachmentChunkCount).toBe(2);
    });

    it('supports idempotent same asset staging but rejects foreign owners and mismatched count', async () => {
        const value = binding();
        await stage(value);
        const pending = await reserve(value);
        await finish(pending);
        await beginShareAttachmentChunk(value, 0);
        await completeShareAttachmentChunk(value, 0);
        await expect(
            beginShareAttachmentChunk({ ...value, ownerProfileId: 'foreign' }, 0)
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        await expect(
            beginShareAttachmentChunk({ ...value, chunkCount: 1 }, 0)
        ).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(await deleteUnreferencedShareAttachment(value)).toBe(false);
    });

    it('serializes cleanup versus pinning so exactly one can acquire the asset', async () => {
        const value = binding();
        await stage(value);
        const [reserved, deleted] = await Promise.allSettled([
            reserve(value),
            deleteUnreferencedShareAttachment(value),
        ]);
        expect(deleted.status).toBe('fulfilled');
        if (reserved.status === 'fulfilled') {
            expect(deleted.status === 'fulfilled' && deleted.value).toBe(false);
            await finish(reserved.value);
        } else {
            expect(deleted.status === 'fulfilled' && deleted.value).toBe(true);
            expect(reserved.reason.code).toBe('PRECONDITION_FAILED');
            await expect(beginShareAttachmentChunk(value, 0)).rejects.toMatchObject({
                code: 'CONFLICT',
            });
        }
    });

    it('abandonment permanently withdraws asset commit authority and queues every exact chunk', async () => {
        const value = binding(3);
        await stage(value);
        const pending = await reserve(value);
        const abandoned = await abandonReservation({
            namespace,
            ownerProfileId: value.ownerProfileId,
            shareId: value.shareId,
            operationId: pending.operationId,
        });
        expect(abandoned.outcome).toBe('abandoned');
        await expect(finish(pending)).rejects.toMatchObject({ code: 'CONFLICT' });
        await expect(beginShareAttachmentChunk(value, 0)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        const jobs = await listCleanupJobsForShare(value.shareId);
        expect(
            jobs
                .filter(job => job.operationId === value.attachmentId)
                .map(job => job.objectRef)
                .sort()
        ).toEqual(
            [0, 1, 2].map(index => shareAttachmentObjectId(value.attachmentId, index)).sort()
        );
        expect(
            jobs.every(
                job => job.ownerProfileId === value.ownerProfileId && job.namespace === namespace
            )
        ).toBe(true);
    });

    it('content replacement preserves the share and queues old chunks, then stopping queues current chunks', async () => {
        const old = binding();
        await stage(old);
        const first = await finish(await reserve(old));
        const next = { ...old, attachmentId: randomUUID(), contentVersion: 2, chunkCount: 3 };
        await stage(next);
        const updated = await reserveReplacement({
            namespace,
            ownerProfileId: old.ownerProfileId,
            shareId: old.shareId,
            expectedVersion: first.share.version,
            clientRequestId: randomUUID(),
            requestHash: 'b'.repeat(64),
            leaseOwner: 'worker',
            content: {
                ...contentBinding(next.attachmentId),
                contentVersion: 2,
                selectedCount: 1,
                attachment: { id: next.attachmentId, chunkCount: next.chunkCount },
            },
        });
        if (updated.outcome !== 'reserved') throw new Error('expected update');
        const second = await finish(updated.reservation);
        expect(second.share.id).toBe(first.share.id);
        expect(second.share.contentVersion).toBe(2);
        expect(second.share.attachmentId).toBe(next.attachmentId);
        let jobs = await listCleanupJobsForShare(old.shareId);
        expect(jobs.filter(job => job.operationId === old.attachmentId)).toHaveLength(2);
        expect(jobs.filter(job => job.operationId === next.attachmentId)).toHaveLength(0);
        await revokeShareLink({
            namespace,
            ownerProfileId: old.ownerProfileId,
            shareId: old.shareId,
        });
        jobs = await listCleanupJobsForShare(old.shareId);
        expect(jobs.filter(job => job.operationId === next.attachmentId)).toHaveLength(3);
        expect(jobs.filter(job => job.operationId === old.attachmentId)).toHaveLength(2);
    });

    it('bounds concurrent never-committed stages to eight and collects expired orphans', async () => {
        const stages = Array.from({ length: 9 }, () => binding(1));
        const results = await Promise.allSettled(
            stages.map(value => beginShareAttachmentChunk(value, 0))
        );
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(8);
        expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
        const queued = await expireShareAttachmentStages({
            namespace,
            now: new Date(Date.now() + 25 * 60 * 60 * 1000),
        });
        expect(queued).toBe(8);
        const completed = stages[results.findIndex(result => result.status === 'fulfilled')];
        await expect(completeShareAttachmentChunk(completed!, 0)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        await expect(beginShareAttachmentChunk(binding(1), 0)).resolves.toBeUndefined();
    }, 60_000);

    it('prevents cross-owner attachment UUID reuse from poisoning global immutable object cleanup', async () => {
        const first = binding(1);
        await stage(first);
        const attacker = { ...binding(1, 'attacker'), attachmentId: first.attachmentId };
        await expect(beginShareAttachmentChunk(attacker, 0)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(await deleteUnreferencedShareAttachment(attacker)).toBe(false);
        expect(await listCleanupJobsForShare(first.shareId)).toHaveLength(0);
    });
});
