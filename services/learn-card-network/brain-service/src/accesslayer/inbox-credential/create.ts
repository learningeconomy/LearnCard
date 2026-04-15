import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential } from '@models';
import { ContactMethodQueryType, InboxCredentialType } from '@learncard/types';
import { flattenObject } from '@helpers/objects.helpers';
import { getInboxCredentialById } from './read';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { ProfileType } from 'types/profile';

export const createInboxCredential = async (input: {
    credential: string;
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

    const id = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30));

    const inboxCredentialData = {
        id,
        credential: input.credential,
        isSigned: input.isSigned,
        currentStatus: 'PENDING' as const,
        isAccepted: input.isAccepted ?? false,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        issuerDid: input.issuerProfile.did,
        webhookUrl: input.webhookUrl,
        boostUri: input.boostUri,
        activityId: input.activityId,
        integrationId: input.integrationId,
        ...(input.signingAuthority ? {
            'signingAuthority.endpoint': input.signingAuthority.endpoint,
            'signingAuthority.name': input.signingAuthority.name,
            ...(input.signingAuthority.listingSlug ? { 'signingAuthority.listingSlug': input.signingAuthority.listingSlug } : {}),
        } : {}),
        ...(input.guardianEmail ? { guardianEmail: input.guardianEmail } : {}),
        ...(input.guardianStatus ? { guardianStatus: input.guardianStatus } : {}),
    };

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

    const contactMethod = await getContactMethodByValue(input.recipient.type, input.recipient.value);
    if (!contactMethod) {
        await createContactMethod({
                type: input.recipient.type,
                value: input.recipient.value,
                isVerified: false,
                isPrimary: false,
            });
        }

    // Create relationships SEQUENTIALLY to prevent deadlocks
    // (Parallel execution can cause deadlocks when multiple transactions
    // try to acquire locks on the same Profile node)
    const timestamp = new Date().toISOString();

    await new QueryBuilder(new BindParam({ inboxId: id, profileId: input.issuerProfile.profileId, timestamp }))
        .match({ model: InboxCredential, identifier: 'ic' })
        .where('ic.id = $inboxId')
        .match('(profile:Profile)')
        .where('profile.profileId = $profileId')
        .create('(profile)-[:CREATED_INBOX_CREDENTIAL { timestamp: $timestamp }]->(ic)')
        .run();

    await new QueryBuilder(new BindParam({ inboxId: id, type: input.recipient.type, value: input.recipient.value, timestamp }))
        .match({ model: InboxCredential, identifier: 'ic' })
        .where('ic.id = $inboxId')
        .match('(contactMethod:ContactMethod)')
        .where('contactMethod.type = $type AND contactMethod.value = $value')
        .create('(ic)-[:ADDRESSED_TO { timestamp: $timestamp }]->(contactMethod)')
        .run();

    return (await getInboxCredentialById(id))!;
};