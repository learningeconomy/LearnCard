import { QueryBuilder, BindParam } from 'neogma';
import { InboxCredential } from '@models';

export const deleteInboxCredential = async (id: string): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: InboxCredential, identifier: 'inboxCredential', where: { id: '$id' } })
        .delete('inboxCredential')
        .run();

    return result.summary.counters.updates().nodesDeleted > 0;
};

export const deleteExpiredInboxCredentials = async (olderThanDays = 90): Promise<number> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await new QueryBuilder(new BindParam({ cutoffDate: cutoffDate.toISOString() }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.currentStatus = "EXPIRED" AND inboxCredential.expiresAt < datetime($cutoffDate)')
        .delete('inboxCredential')
        .run();

    return result.summary.counters.updates().nodesDeleted;
};