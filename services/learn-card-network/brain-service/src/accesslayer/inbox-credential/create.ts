import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential } from '@models';
import { ContactMethodQueryType, InboxCredentialType } from '@learncard/types';
import { flattenObject } from '@helpers/objects.helpers';
import { getInboxCredentialById } from './read';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { ProfileType } from 'types/profile';
import { encryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import { createPendingInboxRefresh } from './refresh';
import { parseCredentialMeta } from '@helpers/credential-meta.helpers';

export const DEFAULT_INBOX_EXPIRY_DAYS = 30;

export const createInboxCredential = async (input: {
    credential: string;
    refresh?: { aggregate: Record<string, unknown>; issueKey: string; requestDigest: string };
    /** Only set after the normal delivery helper has durably stored the credential. */
    delivered?: boolean;
    isSigned: boolean;
    isAccepted?: boolean;
    recipient: ContactMethodQueryType;
    issuerProfile: ProfileType;
    webhookUrl?: string;
    boostUri?: string;
    activityId?: string;
    integrationId?: string;
    signingAuthority?: { endpoint: string; name: string; listingSlug?: string };
    expiresInDays?: number;
    guardianEmail?: string;
    guardianStatus?: 'AWAITING_GUARDIAN' | 'GUARDIAN_APPROVED' | 'GUARDIAN_REJECTED';
}): Promise<InboxCredentialType> => {
    if (
        input.expiresInDays !== undefined &&
        (!Number.isInteger(input.expiresInDays) ||
            input.expiresInDays < 1 ||
            input.expiresInDays > 720)
    ) {
        throw new Error('expiresInDays must be an integer between 1 and 720');
    }

    let id = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? DEFAULT_INBOX_EXPIRY_DAYS));
    // Encrypt before persisting so the credential itself is not stored in plaintext in the inbox.
    const encryptedCredential = input.delivered
        ? undefined
        : await encryptInboxCredential(input.credential);
    const credentialMeta = input.delivered ? {} : parseCredentialMeta(input.credential);

    const inboxCredentialData = {
        id,
        ...(input.refresh ? { refreshId: input.refresh.aggregate.refreshId } : {}),
        credential: encryptedCredential,
        ...credentialMeta,
        isSigned: input.isSigned,
        currentStatus: input.delivered ? ('ISSUED' as const) : ('PENDING' as const),
        ...(input.delivered ? { finalizedAt: new Date().toISOString() } : {}),
        isAccepted: input.isAccepted ?? false,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        issuerDid: input.issuerProfile.did,
        webhookUrl: input.webhookUrl,
        boostUri: input.boostUri,
        activityId: input.activityId,
        integrationId: input.integrationId,
        ...(input.signingAuthority
            ? {
                  'signingAuthority.endpoint': input.signingAuthority.endpoint,
                  'signingAuthority.name': input.signingAuthority.name,
                  ...(input.signingAuthority.listingSlug
                      ? { 'signingAuthority.listingSlug': input.signingAuthority.listingSlug }
                      : {}),
              }
            : {}),
        ...(input.guardianEmail ? { guardianEmail: input.guardianEmail } : {}),
        ...(input.guardianStatus ? { guardianStatus: input.guardianStatus } : {}),
    };

    if (input.refresh) {
        const created = await createPendingInboxRefresh({
            inbox: Object.fromEntries(
                Object.entries(flattenObject(inboxCredentialData)).filter(
                    ([, value]) => value !== undefined
                )
            ),
            aggregate: Object.fromEntries(
                Object.entries({ ...input.refresh.aggregate, inboxCredentialId: id }).filter(
                    ([, value]) => value !== undefined
                )
            ),
            issueKey: input.refresh.issueKey,
            requestDigest: input.refresh.requestDigest,
        });
        id = created.id;
    } else {
        await new QueryBuilder(
            new BindParam({
                params: flattenObject(inboxCredentialData),
                issuerProfileId: input.issuerProfile.profileId,
                timestamp: new Date().toISOString(),
            })
        )
            .create({ model: InboxCredential, identifier: 'inboxCredential' })
            .set('inboxCredential += $params')
            .run();
    }

    const contactMethod = await getContactMethodByValue(
        input.recipient.type,
        input.recipient.value
    );
    if (!contactMethod) {
        try {
            await createContactMethod({
                type: input.recipient.type,
                value: input.recipient.value,
                isVerified: false,
                isPrimary: false,
            });
        } catch (error) {
            // A concurrent idempotent issue may have created the same contact first.
            if (
                !input.refresh ||
                !(await getContactMethodByValue(input.recipient.type, input.recipient.value))
            )
                throw error;
        }
    }

    // Create relationships SEQUENTIALLY to prevent deadlocks
    // (Parallel execution can cause deadlocks when multiple transactions
    // try to acquire locks on the same Profile node)
    const timestamp = new Date().toISOString();

    await new QueryBuilder(
        new BindParam({ inboxId: id, profileId: input.issuerProfile.profileId, timestamp })
    )
        .match({ model: InboxCredential, identifier: 'ic' })
        .where('ic.id = $inboxId')
        .match('(profile:Profile)')
        .where('profile.profileId = $profileId')
        .merge('(profile)-[created:CREATED_INBOX_CREDENTIAL]->(ic)')
        .set('created.timestamp = coalesce(created.timestamp, $timestamp)')
        .run();

    await new QueryBuilder(
        new BindParam({
            inboxId: id,
            type: input.recipient.type,
            value: input.recipient.value,
            timestamp,
        })
    )
        .match({ model: InboxCredential, identifier: 'ic' })
        .where('ic.id = $inboxId')
        .match('(contactMethod:ContactMethod)')
        .where('contactMethod.type = $type AND contactMethod.value = $value')
        .merge('(ic)-[addressed:ADDRESSED_TO]->(contactMethod)')
        .set('addressed.timestamp = coalesce(addressed.timestamp, $timestamp)')
        .run();

    return (await getInboxCredentialById(id))!;
};
