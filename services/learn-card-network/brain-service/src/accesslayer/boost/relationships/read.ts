import { BindParam, Op, QueryBuilder, Where } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { BoostRecipientInfo } from '@learncard/types';
import {
    Boost,
    BoostInstance,
    Profile,
    ProfileInstance,
    Credential,
    CredentialInstance,
    CredentialRelationships,
    ProfileRelationships,
} from '@models';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { ProfileType } from 'types/profile';

export const getBoostOwner = async (boost: BoostInstance): Promise<ProfileInstance | undefined> => {
    return (await boost.findRelationships({ alias: 'createdBy' }))[0]?.target;
};

export const getCredentialInstancesOfBoost = async (
    boost: BoostInstance
): Promise<CredentialInstance[] | undefined> => {
    return (
        await Credential.findRelationships({
            alias: 'instanceOf',
            where: { target: { id: boost.id } },
        })
    ).map(relationship => relationship.source);
};

/**
 * Query to get the recipients of a boost. Cipher Code is:
 * MATCH (source:`Boost` { id: $id })<-[instanceOf:INSTANCE_OF]-(credential:`Credential`)-[received:CREDENTIAL_RECEIVED]->(recipient:`Profile`)
 */
export const getBoostRecipients = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        includeUnacceptedBoosts = true,
    }: {
        limit: number;
        cursor?: string;
        includeUnacceptedBoosts?: boolean;
    }
): Promise<Array<BoostRecipientInfo & { sent: string }>> => {
    const _query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient', model: Profile },
            ],
        });

    const query = cursor
        ? _query.where(new Where({ sent: { date: { [Op.gt]: cursor } } }, _query.getBindParam()))
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        sender: ProfileInstance;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: ProfileInstance;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(await query.return('sender, sent, received').orderBy('sent.date').limit(limit).run());

    const resultsWithIds = results.map(({ sender, sent, received }) => ({
        sent: sent.date,
        to: sent.to,
        from: sender.profileId,
        received: received?.date,
    }));

    const recipients = await getProfilesByProfileIds(resultsWithIds.map(result => result.to));

    return resultsWithIds
        .map(result => ({
            ...result,
            to: recipients.find(recipient => recipient.profileId === result.to),
        }))
        .filter(result => Boolean(result.to)) as Array<BoostRecipientInfo & { sent: string }>;
};

/** @deprecated */
export const getBoostRecipientsSkipLimit = async (
    boost: BoostInstance,
    {
        limit,
        skip,
        includeUnacceptedBoosts = true,
    }: {
        limit: number;
        skip?: number;
        includeUnacceptedBoosts?: boolean;
    }
): Promise<BoostRecipientInfo[]> => {
    const query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient', model: Profile },
            ],
        });

    const results = convertQueryResultToPropertiesObjectArray<{
        sender: ProfileInstance;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: ProfileInstance;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(
        await query
            .return('sender, sent, received')
            .limit(limit)
            .skip(skip ?? 0)
            .run()
    );

    const resultsWithIds = results.map(({ sender, sent, received }) => ({
        to: sent.to,
        from: sender.profileId,
        received: received?.date,
    }));

    const recipients = await getProfilesByProfileIds(resultsWithIds.map(result => result.to));

    return resultsWithIds
        .map(result => ({
            ...result,
            to: recipients.find(recipient => recipient.profileId === result.to),
        }))
        .filter(result => Boolean(result.to)) as BoostRecipientInfo[];
};

export const countBoostRecipients = async (
    boost: BoostInstance,
    { includeUnacceptedBoosts = true }: { includeUnacceptedBoosts?: boolean }
): Promise<number> => {
    const query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient', model: Profile },
            ],
        });

    const result = await query.return('COUNT(DISTINCT sent.to) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getBoostAdmins = async (
    boost: BoostInstance,
    { limit, cursor, blacklist = [] }: { limit: number; cursor?: string; blacklist?: string[] }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder(new BindParam({ blacklist }))
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                `-[:${Profile.getRelationshipByAlias('adminOf').name}|${Boost.getRelationshipByAlias('createdBy').name
                }]-`,
                { identifier: 'admin', model: Profile },
            ],
        })
        .where('NOT admin.profileId IN $blacklist');

    const query = cursor
        ? _query.where(
            new Where({ admin: { profileId: { [Op.gt]: cursor } } }, _query.getBindParam())
        )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        admin: ProfileType;
    }>(await query.return('admin').orderBy('admin.profileId').limit(limit).run());

    return results.map(({ admin }) => admin);
};

export const isProfileBoostAdmin = async (profile: ProfileInstance, boost: BoostInstance) => {
    const query = new QueryBuilder().match({
        related: [
            { model: Boost, where: { id: boost.id } },
            `-[:${Profile.getRelationshipByAlias('adminOf').name}|${Boost.getRelationshipByAlias('createdBy').name
            }]-`,
            { identifier: 'profile', model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const result = await query.return('count(profile) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};
