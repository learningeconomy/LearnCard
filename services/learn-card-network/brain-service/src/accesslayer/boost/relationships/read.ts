import { QueryBuilder } from 'neogma';
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
