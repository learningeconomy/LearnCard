import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { InboxCredential, EmailAddress, Profile } from '@models';
import { InboxCredentialType } from 'types/inbox-credential';
import { inflateObject } from '@helpers/objects.helpers';

export const getInboxCredentialById = async (id: string): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder()
        .match({
            model: InboxCredential,
            identifier: 'inboxCredential',
            where: { id },
        })
        .return('inboxCredential')
        .limit(1)
        .run();

    const inboxCredential = result.records[0]?.get('inboxCredential').properties;

    if (!inboxCredential) return null;

    return inflateObject<InboxCredentialType>(inboxCredential as any);
};

export const getPendingInboxCredentialsForEmail = async (email: string): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ email }))
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { email: '$email' } })
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(emailAddress)')
        .where('inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt > datetime()')
        .return('inboxCredential')
        .run();

    return QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
        credential => inflateObject<InboxCredentialType>(credential as any)
    ) ?? [];
};

export const getPendingInboxCredentialsForEmailAddress = async (emailAddressId: string): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ emailAddressId }))
        .match({ model: EmailAddress, identifier: 'emailAddress', where: { id: '$emailAddressId' } })
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(emailAddress)')
        .where('inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt > datetime()')
        .return('inboxCredential')
        .run();

    return QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
        credential => inflateObject<InboxCredentialType>(credential as any)
    ) ?? [];
};

export const getInboxCredentialsForProfile = async (
    profileDid: string,
    status?: InboxCredentialType['currentStatus']
): Promise<InboxCredentialType[]> => {
    const statusFilter = status ? ` AND inboxCredential.currentStatus = "${status}"` : '';
    
    const result = await new QueryBuilder(new BindParam({ profileDid }))
        .match({ model: Profile, identifier: 'profile', where: { did: '$profileDid' } })
        .match('(profile)-[:CREATED_INBOX_CREDENTIAL]->(inboxCredential:InboxCredential)')
        .where(`true ${statusFilter}`)
        .return('inboxCredential')
        .orderBy('inboxCredential.createdAt DESC')
        .run();

    return QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
        credential => inflateObject<InboxCredentialType>(credential as any)
    ) ?? [];
};

export const getExpiredInboxCredentials = async (limit = 100): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder()
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt <= datetime()')
        .return('inboxCredential')
        .limit(limit)
        .run();

    return QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
        credential => inflateObject<InboxCredentialType>(credential as any)
    ) ?? [];
};