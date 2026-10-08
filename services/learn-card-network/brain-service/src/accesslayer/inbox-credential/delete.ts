import { QueryBuilder, BindParam } from 'neogma';
import { InboxCredential } from '@models';
import { INBOX_MAINTENANCE_BATCH_SIZE } from 'types/inbox-delivery';

export const deleteInboxCredential = async (id: string): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$id' } })
        .delete('inboxCredential')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};

export const deleteExpiredInboxCredentials = async (
    olderThanDays = 90,
    limit = INBOX_MAINTENANCE_BATCH_SIZE
): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await new QueryBuilder(new BindParam({ cutoffDate: cutoffDate.toISOString() }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.currentStatus = "EXPIRED" AND datetime(coalesce(inboxCredential.expiredAt, inboxCredential.expiresAt)) < datetime($cutoffDate)'
        )
        .with('inboxCredential')
        .orderBy('inboxCredential.expiresAt, inboxCredential.id')
        .limit(limit)
        .delete({ identifiers: ['inboxCredential'], detach: true })
        .run();

    return result.summary.counters.updates().nodesDeleted;
};
