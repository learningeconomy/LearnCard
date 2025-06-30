import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { InboxCredential, EmailAddress, InboxCredentialInstance } from '@models';
import { InboxCredentialType } from 'types/inbox-credential';
import { inflateObject } from '@helpers/objects.helpers';
import { InboxCredentialQuery } from 'types/inbox-credential';
import { convertQueryResultToPropertiesObjectArray, convertObjectRegExpToNeo4j, getMatchQueryWhere } from '@helpers/neo4j.helpers';

export const getInboxCredentialById = async (id: string): Promise<InboxCredentialInstance | null> => {
    return InboxCredential.findOne({ where: { id } });
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

export const getPendingInboxCredentialsForEmailId = async (emailAddressId: string): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ emailAddressId }))
        .match({ model: EmailAddress, identifier: 'emailAddress' })
        .where('emailAddress.id = $emailAddressId')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(emailAddress)')
        .where(`inboxCredential.currentStatus = "PENDING" AND datetime(inboxCredential.expiresAt) > datetime()`)
        .return('inboxCredential')
        .run();

    return QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
        credential => inflateObject<InboxCredentialType>(credential as any)
    ) ?? [];
};

export const getInboxCredentialsForProfile = async (
    profileId: string,
    { limit, cursor, query: matchQuery = {}, recipientEmail }: { limit: number; cursor?: string; query?: InboxCredentialQuery; recipientEmail?: string },
): Promise<InboxCredentialType[]> => {    
    const _query = new QueryBuilder(new BindParam({ profileId, matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor, recipientEmail }))
    .match('(profile)-[:CREATED_INBOX_CREDENTIAL]->(inboxCredential:InboxCredential)')
    .where(`profile.profileId = $profileId AND ${getMatchQueryWhere('inboxCredential')}`);

    if (recipientEmail) {
        _query.match('(inboxCredential)-[:ADDRESSED_TO]->(emailAddress:EmailAddress)')
            .where('emailAddress.email = $recipientEmail');
    }

    const query = cursor ? _query.raw('AND inboxCredential.createdAt < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        inboxCredential: InboxCredentialType;
    }>(
        await query
            .return('DISTINCT inboxCredential')
            .orderBy('inboxCredential.createdBy DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.inboxCredential as any),
    }));
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