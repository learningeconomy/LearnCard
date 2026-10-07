import { createHash, randomBytes } from 'node:crypto';
import { v4 as uuid } from 'uuid';
import { neogma } from '@instance';
import { computeShareLinkRequestHash } from '@helpers/share-link-lifecycle';
import { reserveCreate } from '../../src/accesslayer/share-link';

export const nextShareId = (): string => randomBytes(16).toString('base64url');

export const contentBinding = (seed: string) => ({
    contentHash: createHash('sha256').update(`content:${seed}`).digest('hex'),
    contentBytes: 128,
    recoveryHash: createHash('sha256').update(`recovery:${seed}`).digest('hex'),
    recoveryBytes: 256,
});

export const clearLifecycleGraph = async (): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (n)
         WHERE n:ShareLink OR n:ShareLinkReservation OR n:ShareLinkOperation OR n:ShareContentCleanupJob
         DETACH DELETE n`
    );
};

export type ReservedCreate = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    clientRequestId: string;
    requestHash: string;
    operationId: string;
    objectRef: string;
    generation: number;
    leaseOwner: string;
};

export const reserveShareFixture = async (options: {
    ownerProfileId: string;
    shareId?: string;
    expiresAt?: string | null;
    selectedCount?: number;
    title?: string;
    leaseMs?: number;
    now: Date;
    clientRequestId?: string;
    requestHash?: string;
    namespace: string;
}): Promise<ReservedCreate> => {
    const namespace = options.namespace;
    const ownerProfileId = options.ownerProfileId;
    const shareId = options.shareId ?? nextShareId();
    const clientRequestId = options.clientRequestId ?? uuid();
    const selectedCount = options.selectedCount ?? 1;
    const content = contentBinding(shareId);
    const requestHash =
        options.requestHash ??
        computeShareLinkRequestHash('create', {
            id: shareId,
            title: options.title ?? 'Shared credentials',
            selectedCount,
            ...content,
        });

    const result = await reserveCreate({
        namespace,
        ownerProfileId,
        clientRequestId,
        shareId,
        title: options.title ?? 'Shared credentials',
        note: null,
        expiresAt: options.expiresAt ?? null,
        selectedCount,
        content,
        requestHash,
        leaseOwner: 'worker-1',
        leaseMs: options.leaseMs,
        now: options.now,
    });

    if (result.outcome !== 'reserved' || !result.reservation.objectRef) {
        throw new Error(`expected reserved create, got ${result.outcome}`);
    }

    return {
        namespace,
        ownerProfileId,
        shareId,
        clientRequestId,
        requestHash,
        operationId: result.reservation.operationId,
        objectRef: result.reservation.objectRef,
        generation: result.reservation.generation,
        leaseOwner: result.reservation.leaseOwner,
    };
};
