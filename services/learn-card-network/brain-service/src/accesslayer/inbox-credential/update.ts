import { QueryBuilder, BindParam } from 'neogma';
import { InboxCredential } from '@models';
import { InboxCredentialType } from '@learncard/types';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';

export const updateInboxCredential = async (
    id: string,
    updates: Partial<Omit<InboxCredentialType, 'id' | 'createdAt'>>
): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder(
        new BindParam({ id, updates: flattenObject(updates) })
    )
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.id = $id')
        .set('inboxCredential += $updates')
        .return('inboxCredential')
        .limit(1)
        .run();

    const inboxCredential = result.records[0]?.get('inboxCredential').properties;

    if (!inboxCredential) return null;

    return inflateObject<InboxCredentialType>(inboxCredential as any);
};

export const markInboxCredentialAsDelivered = async (
    id: string
): Promise<InboxCredentialType | null> => {
    return updateInboxCredential(id, {
        currentStatus: 'DELIVERED',
    });
};

export const markInboxCredentialAsClaimed = async (id: string): Promise<InboxCredentialType | null> => {
    return updateInboxCredential(id, {
        currentStatus: 'CLAIMED',
    });
};

export const markInboxCredentialAsExpired = async (id: string): Promise<InboxCredentialType | null> => {
    return updateInboxCredential(id, {
        currentStatus: 'EXPIRED',
    });
};

export const expireInboxCredentials = async (): Promise<number> => {
    const result = await new QueryBuilder()
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt <= datetime()')
        .set('inboxCredential.currentStatus = "EXPIRED"')
        .return('count(inboxCredential) as expiredCount')
        .run();

    const expiredCount = result.records[0]?.get('expiredCount');
    return expiredCount?.toNumber() ?? 0;
};