import { shareAttachmentTuple } from '../../accesslayer/share-link/attachment';
import type { ShareLinkReservationRecord } from '../../accesslayer/share-link/types';
import type { ShareContentClient } from '../share-content-client';
import type { MaintenanceBudget } from './types';
import { budgetAllows } from './budget-helpers';

/** Verify the complete immutable set before releasing the atomic commit fence. */
export const verifyShareAttachmentStats = async (
    client: Pick<ShareContentClient, 'stat'>,
    reservation: ShareLinkReservationRecord,
    budget?: MaintenanceBudget,
    remoteAndFinalizeCostMs = 0
): Promise<boolean> => {
    if (reservation.contentVersion === null || !reservation.attachmentId) return true;
    const count = reservation.attachmentChunkCount;
    if (!count || count < 1 || count > 16) return false;
    const binding = {
        namespace: reservation.namespace,
        ownerProfileId: reservation.ownerProfileId,
        shareId: reservation.shareId,
        contentVersion: reservation.contentVersion,
        attachmentId: reservation.attachmentId,
        chunkCount: count,
    };
    for (let index = 0; index < count; index++) {
        // Each bounded HTTP call must leave enough time for finalization and the
        // pass reserve. A many-chunk asset cannot overrun the maintenance budget.
        if (!budgetAllows(budget, remoteAndFinalizeCostMs)) return false;
        const tuple = shareAttachmentTuple(binding, index);
        const result = await client.stat(tuple);
        if (!result.ok || result.value.kind !== 'active') return false;
        const active = result.value;
        if (
            Object.entries(tuple).some(
                ([key, value]) => active[key as keyof typeof active] !== value
            )
        )
            return false;
    }
    return true;
};
