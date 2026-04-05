import { QueryBuilder, BindParam, QueryRunner } from 'neogma';
import { InboxCredential, ContactMethod, InboxCredentialInstance } from '@models';
import { InboxCredentialType, InboxCredentialQuery, ContactMethodType } from '@learncard/types';
import { inflateObject } from '@helpers/objects.helpers';
import {
    convertObjectRegExpToNeo4j,
    buildWhereForQueryBuilder,
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

export const getPendingOrIssuedInboxCredentialsForContactMethodId = async (
    contactMethodId: string
): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ contactMethodId }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(contactMethod)')
        .where(`(inboxCredential.currentStatus = "PENDING" OR inboxCredential.currentStatus = "ISSUED") AND datetime(inboxCredential.expiresAt) > datetime()`)
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

export const getAcceptedPendingInboxCredentialsForContactMethodId = async (
    contactMethodId: string
): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ contactMethodId }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(contactMethod)')
        .where(`inboxCredential.currentStatus = "PENDING" AND inboxCredential.isAccepted = true AND datetime(inboxCredential.expiresAt) > datetime()`) // TODO: Add status filter?
        .return('inboxCredential')
        .run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(credential =>
            inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};

export const getInboxCredentialsForContactMethodId = async (
    contactMethodId: string
): Promise<InboxCredentialType[]> => {
    const result = await new QueryBuilder(new BindParam({ contactMethodId }))
        .match({ model: ContactMethod, identifier: 'contactMethod' })
        .where('contactMethod.id = $contactMethodId')
        .match('(inboxCredential:InboxCredential)-[:ADDRESSED_TO]->(contactMethod)')
        .where(`datetime(inboxCredential.expiresAt) > datetime()`) // TODO: Add status filter?
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
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder('inboxCredential', convertedQuery as any);
    
    const queryClause = whereClause !== 'true' ? ` AND ${whereClause}` : '';
    const cursorClause = cursor ? ` AND inboxCredential.createdAt < $cursor` : '';

    const _query = new QueryBuilder(new BindParam({
        profileId,
        cursor,
        recipient,
        ...queryParams,
    }))
        .match('(profile)-[:CREATED_INBOX_CREDENTIAL]->(inboxCredential:InboxCredential)')
        .where(`profile.profileId = $profileId${queryClause}${cursorClause}`);

    if (recipient) {
        _query
            .match('(inboxCredential)-[:ADDRESSED_TO]->(contactMethod:ContactMethod)')
            .where('contactMethod.type = $recipient.type AND contactMethod.value = $recipient.value');
    }

    _query.return('inboxCredential').orderBy('inboxCredential.createdAt DESC');


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

export const getInboxCredentialsByGuardianEmail = async (
    guardianEmail: string,
    guardianStatus?: string
): Promise<InboxCredentialType[]> => {
    const bindParams = { guardianEmail, ...(guardianStatus ? { guardianStatus } : {}) };
    const statusClause = guardianStatus ? 'AND inboxCredential.guardianStatus = $guardianStatus' : '';

    const result = await new QueryBuilder(new BindParam(bindParams))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where(`inboxCredential.guardianEmail = $guardianEmail ${statusClause} AND datetime(inboxCredential.expiresAt) > datetime()`)
        .return('inboxCredential')
        .run();

    return (
        QueryRunner.getResultProperties<InboxCredentialType[]>(result, 'inboxCredential')?.map(
            credential => inflateObject<InboxCredentialType>(credential as any)
        ) ?? []
    );
};

export const getInboxCredentialByIdAndGuardianEmail = async (
    id: string,
    guardianEmail: string
): Promise<InboxCredentialType | null> => {
    const result = await new QueryBuilder(new BindParam({ id, guardianEmail }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.id = $id AND inboxCredential.guardianEmail = $guardianEmail')
        .return('inboxCredential')
        .limit(1)
        .run();

    const credential = result.records[0]?.get('inboxCredential')?.properties;
    if (!credential) return null;
    return inflateObject<InboxCredentialType>(credential as any);
};

export const getContactMethodForInboxCredential = async (
    inboxCredentialId: string
): Promise<ContactMethodType | null> => {
    const result = await new QueryBuilder(new BindParam({ id: inboxCredentialId }))
        .match({ model: InboxCredential, identifier: 'inboxCredential' })
        .where('inboxCredential.id = $id')
        .match('(inboxCredential)-[:ADDRESSED_TO]->(contactMethod:ContactMethod)')
        .return('contactMethod')
        .limit(1)
        .run();

    const cm = result.records[0]?.get('contactMethod')?.properties;
    if (!cm) return null;
    return inflateObject<ContactMethodType>(cm as any);
};