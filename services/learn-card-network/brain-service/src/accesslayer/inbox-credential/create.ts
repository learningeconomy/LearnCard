import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential, InboxCredentialInstance } from '@models';
import { ContactMethodQueryType } from '@learncard/types';
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
    signingAuthority?: { endpoint: string; name: string };
    expiresInDays?: number;
}): Promise<InboxCredentialInstance> => {

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
        } : {}),
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

    const inboxCredential = (await getInboxCredentialById(id))!;

    // Create relationships SEQUENTIALLY to prevent deadlocks
    // (Parallel execution can cause deadlocks when multiple transactions
    // try to acquire locks on the same Profile node)
    await inboxCredential.relateTo({
        alias: 'createdBy',
        properties: { timestamp: new Date().toISOString() },
        where: { profileId: input.issuerProfile.profileId },
    });

    await inboxCredential.relateTo({
        alias: 'addressedTo',
        properties: { timestamp: new Date().toISOString() },
        where: { type: input.recipient.type, value: input.recipient.value },
    });

    return inboxCredential;
};