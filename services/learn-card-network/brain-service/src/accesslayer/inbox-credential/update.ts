import { QueryBuilder, BindParam } from 'neogma';
import { InboxCredential } from '@models';
import { InboxCredentialType } from '@learncard/types';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';
import {
    InboxDelivery,
    INBOX_DELIVERY_RETENTION_DAYS,
    INBOX_MAINTENANCE_BATCH_SIZE,
} from 'types/inbox-delivery';

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
    id: string,
    delivery: InboxDelivery,
    { isAccepted = true }: { isAccepted?: boolean } = {}
): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder(
        new BindParam({
            id,
            isAccepted,
            finalizedAt: new Date().toISOString(),
            deliveryCredential: JSON.stringify(delivery.credential),
            deliveryRecipientDid: delivery.recipientDid,
            deliveryExpiresAt: new Date(
                Date.now() + INBOX_DELIVERY_RETENTION_DAYS * 86400000
            ).toISOString(),
        })
    )
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.id = $id')
        // The write acquires a Neo4j node lock that is held until this transaction commits,
        // even though the temporary property is removed before persisting the final state.
        // Rechecking eligibility after the lock guarantees that only one finalizer succeeds.
        .set('inboxCredential._escrowLock = true')
        .remove('inboxCredential._escrowLock')
        .with('inboxCredential')
        .where(
            'inboxCredential.currentStatus = "PENDING" AND datetime(inboxCredential.expiresAt) > datetime()'
        )
        .set(
            'inboxCredential.currentStatus = "ISSUED", inboxCredential.isAccepted = $isAccepted, inboxCredential.finalizedAt = $finalizedAt, inboxCredential.credential = null, inboxCredential.credentialName = null, inboxCredential.achievementType = null'
        )
        .set(
            'inboxCredential.deliveryCredential = $deliveryCredential, inboxCredential.deliveryRecipientDid = $deliveryRecipientDid, inboxCredential.deliveryExpiresAt = $deliveryExpiresAt'
        )
        .return('inboxCredential')
        .limit(1)
        .run();

    const inboxCredential = result.records[0]?.get('inboxCredential')?.properties;
    return inboxCredential
        ? inflateObject<InboxCredentialType>(inboxCredential as InboxCredentialType)
        : null;
};

export const expireInboxCredentials = async (
    limit = INBOX_MAINTENANCE_BATCH_SIZE
): Promise<number> => {
    const result = await new QueryBuilder(new BindParam({ expiredAt: new Date().toISOString() }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            'inboxCredential.currentStatus = "PENDING" AND datetime(inboxCredential.expiresAt) <= datetime()'
        )
        .with('inboxCredential')
        .orderBy('inboxCredential.expiresAt, inboxCredential.id')
        .limit(limit)
        // As with claim finalization, serialize state changes on the inbox node before
        // re-evaluating expiry eligibility.
        .set('inboxCredential._escrowLock = true')
        .remove('inboxCredential._escrowLock')
        .with('inboxCredential')
        .where(
            'inboxCredential.currentStatus = "PENDING" AND datetime(inboxCredential.expiresAt) <= datetime()'
        )
        .set(
            'inboxCredential.currentStatus = "EXPIRED", inboxCredential.expiredAt = $expiredAt, inboxCredential.credential = null, inboxCredential.credentialName = null, inboxCredential.achievementType = null'
        )
        .return('count(inboxCredential) as expiredCount')
        .run();

    const expiredCount = result.records[0]?.get('expiredCount');
    return expiredCount?.toNumber() ?? 0;
};

/** Removes expired holder-only recovery copies, preserving the issuer's audit record.
 * Delivery timestamps are canonical UTC ISO strings; direct comparison permits an index range seek.
 */
export const wipeExpiredInboxDeliveries = async (
    limit = INBOX_MAINTENANCE_BATCH_SIZE
): Promise<number> => {
    const result = await new QueryBuilder(new BindParam({ now: new Date().toISOString() }))
        .match({ model: InboxCredential, identifier: 'ic' })
        .where('ic.deliveryCredential IS NOT NULL AND ic.deliveryExpiresAt <= $now')
        .with('ic')
        .orderBy('ic.deliveryExpiresAt, ic.id')
        .limit(limit)
        .remove('ic.deliveryCredential, ic.deliveryRecipientDid, ic.deliveryExpiresAt')
        .return('count(ic) AS wiped')
        .run();
    return result.records[0]?.get('wiped')?.toNumber() ?? 0;
};
