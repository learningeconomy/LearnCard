import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { InboxCredential, ContactMethod, InboxCredentialInstance } from '@models';
import { InboxCredentialType } from 'types/inbox-credential';
import { inflateObject } from '@helpers/objects.helpers';
import { InboxCredentialQuery } from 'types/inbox-credential';
import {
    convertObjectRegExpToNeo4j,
    getMatchQueryWhere,
} from '@helpers/neo4j.helpers';

export const getInboxCredentialById = async (id: string): Promise<InboxCredentialInstance | null> => {
    return InboxCredential.findOne({ where: { id } });
};

export const getPendingInboxCredentialsForContactMethod = async (
    type: string,
    value: string
): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ type, value }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.type = $type AND contactMethod.value = $value')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(contactMethod)')
        .where('inboxCredential.currentStatus = "PENDING" AND inboxCredential.expiresAt > datetime()')
        .return('inboxCredential')
        .run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(credential =>
            inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};

export const getPendingInboxCredentialsForContactMethodId = async (
    contactMethodId: string
): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ contactMethodId }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(contactMethod)')
        .where(`inboxCredential.currentStatus = "PENDING" AND datetime(inboxCredential.expiresAt) > datetime()`)
        .return('inboxCredential')
        .run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(credential =>
            inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};

export const getInboxCredentialsForProfile = async (
    profileId: string,
    {
        limit,
        cursor,
        query: matchQuery = {},
        recipient,
    }: {
        limit: number;
        cursor?: string;
        query?: InboxCredentialQuery;
        recipient?: { type: string; value: string };
    }
): Promise<InboxCredentialType[]> => {
    const _query = new QueryBuilder(
        new BindParam({
            profileId,
            matchQuery: convertObjectRegExpToNeo4j(matchQuery),
            cursor,
            recipient,
        })
    )
        .match('(profile)-[:CREATED_INBOX_CREDENTIAL]->(inboxCredential:InboxCredential)')
        .where(`profile.profileId = $profileId AND ${getMatchQueryWhere('inboxCredential')}`);

    if (recipient) {
        _query
            .match('(inboxCredential)-[:ADDRESSED_TO]->(contactMethod:ContactMethod)')
            .where('contactMethod.type = $recipient.type AND contactMethod.value = $recipient.value');
    }

    _query.return('inboxCredential').orderBy('inboxCredential.createdAt DESC');

    if (cursor) {
        _query.where('inboxCredential.id < $cursor');
    }

    const result = await _query.limit(limit).run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(credential =>
            inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};

export const getExpiredInboxCredentials = async (limit = 100): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder()
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(
            `inboxCredential.currentStatus = 'PENDING' AND datetime(inboxCredential.expiresAt) <= datetime()`
        )
        .return('inboxCredential')
        .limit(limit)
        .run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(credential =>
            inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};