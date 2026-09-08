import { QueryBuilder, BindParam } from 'neogma';
import { InboxCredential } from '@models';
import { InboxCredentialType } from '@learncard/types';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';

export const updateInboxCredential = async (
    id: string,
    updates: Partial<Omit<InboxCredentialType, 'id' | 'createdAt' | 'credential'>>
): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder(new BindParam({ id, updates: flattenObject(updates) }))
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

/** Atomically completes an eligible claim and removes its sensitive payload. */
export const finalizeAndWipeInboxCredential = async (
    id: string
): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder(
        new BindParam({ id, finalizedAt: new Date().toISOString() })
    )
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.id = $id AND inboxCredential.currentStatus = "PENDING"')
        .set(
            'inboxCredential.currentStatus = "ISSUED", inboxCredential.isAccepted = true, inboxCredential.finalizedAt = $finalizedAt, inboxCredential.credential = null'
        )
        .return('inboxCredential')
        .limit(1)
        .run();

    const inboxCredential = result.records[0]?.get('inboxCredential')?.properties;
    return inboxCredential ? inflateObject<InboxCredentialType>(inboxCredential as any) : null;
};

export const expireInboxCredentials = async (): Promise<number> => {
    const result = await new QueryBuilder(new BindParam({ expiredAt: new Date().toISOString() }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt <= datetime()'
        )
        .set(
            'inboxCredential.currentStatus = "EXPIRED", inboxCredential.expiredAt = $expiredAt, inboxCredential.credential = null'
        )
        .return('count(inboxCredential) as expiredCount')
        .run();

    const expiredCount = result.records[0]?.get('expiredCount');
    return expiredCount?.toNumber() ?? 0;
};
