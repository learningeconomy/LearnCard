import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential } from '@models';
import { InboxCredentialType, ContactMethodQueryType } from '@learncard/types';
import { flattenObject } from '@helpers/objects.helpers';
import { getInboxCredentialById } from './read';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { ProfileType } from 'types/profile';

export const createInboxCredential = async (input: {
    credential: string;
    isSigned: boolean;
    recipient: ContactMethodQueryType;
    issuerProfile: ProfileType;
    webhookUrl?: string;
    signingAuthority?: { endpoint: string; name: string };
    expiresInDays?: number;
}): Promise<InboxCredentialType> => {

    const id = uuid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30));

    const inboxCredentialData = {
        id,
        credential: input.credential,
        isSigned: input.isSigned,
        currentStatus: 'PENDING' as const,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        issuerDid: input.issuerProfile.did,
        webhookUrl: input.webhookUrl,
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

    await Promise.all([
        inboxCredential.relateTo({
            alias: 'createdBy',
            properties: { timestamp: new Date().toISOString() },
            where: { profileId: input.issuerProfile.profileId },
        }),
        inboxCredential.relateTo({
            alias: 'addressedTo',
            properties: { timestamp: new Date().toISOString() },
            where: { type: input.recipient.type, value: input.recipient.value },
        }),
    ]);

    return inboxCredential;
};