import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential, EmailAddress, Profile } from '@models';
import { InboxCredentialType } from 'types/inbox-credential';
import { flattenObject } from '@helpers/objects.helpers';
import { getInboxCredentialById } from './read';
import { getEmailAddressByEmail } from '@accesslayer/email-address/read';
import { createEmailAddress } from '@accesslayer/email-address/create';

export const createInboxCredential = async (input: {
    credential: string;
    isSigned: boolean;
    recipientEmail: string;
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

    const result = await new QueryBuilder(
        new BindParam({
            params: flattenObject(inboxCredentialData),
            recipientEmail: input.recipientEmail,
            issuerProfileId: input.issuerProfile.profileId,
            timestamp: new Date().toISOString(),
        })
    )
        .create({ model: InboxCredential, identifier: 'inboxCredential' })
        .set('inboxCredential += $params')
        .run();

    const emailAddress = await getEmailAddressByEmail(input.recipientEmail);
    if (!emailAddress) {
        await createEmailAddress({
                email: input.recipientEmail,
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
                where: { email: input.recipientEmail },
            }),
        ]);

    return inboxCredential;
};