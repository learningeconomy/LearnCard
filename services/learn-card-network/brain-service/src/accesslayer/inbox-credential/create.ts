import { QueryBuilder, BindParam } from 'neogma';
import { v4 as uuid } from 'uuid';

import { InboxCredential, EmailAddress, Profile } from '@models';
import { InboxCredentialType } from 'types/inbox-credential';
import { flattenObject } from '@helpers/objects.helpers';

export const createInboxCredential = async (input: {
    credential: string;
    isSigned: boolean;
    recipientEmail: string;
    issuerDid: string;
    webhookUrl?: string;
    signingAuthority?: { endpoint: string; name: string };
    expiresInDays?: number;
}): Promise<InboxCredentialType> => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 30));

    const inboxCredentialData = {
        id: uuid(),
        credential: input.credential,
        isSigned: input.isSigned,
        currentStatus: 'PENDING' as const,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        issuerDid: input.issuerDid,
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
            issuerDid: input.issuerDid,
            timestamp: new Date().toISOString(),
        })
    )
        .create({ model: InboxCredential, identifier: 'inboxCredential' })
        .set('inboxCredential += $params')
        .with('inboxCredential')
        
        // Connect to issuer profile
        .match({ model: Profile, identifier: 'issuer', where: { did: '$issuerDid' } })
        .create('(issuer)-[:CREATED_INBOX_CREDENTIAL { timestamp: $timestamp }]->(inboxCredential)')
        .with('inboxCredential')
        
        // Connect to email address (create if doesn't exist)
        .merge({ 
            model: EmailAddress, 
            identifier: 'emailAddress', 
            where: { email: '$recipientEmail' },
            onCreate: { 
                email: '$recipientEmail', 
                id: uuid(),
                isVerified: false,
                isPrimary: false,
                createdAt: '$timestamp'
            }
        })
        .create('(inboxCredential)-[:ADDRESSED_TO]->(emailAddress)')
        
        .return('inboxCredential')
        .limit(1)
        .run();

    const inboxCredential = result.records[0]?.get('inboxCredential').properties!;

    return inboxCredential as InboxCredentialType;
};