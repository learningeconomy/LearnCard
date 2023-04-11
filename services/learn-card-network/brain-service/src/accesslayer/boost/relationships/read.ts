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
} from '@models';

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
    }: {
        limit: number;
        skip?: number;
    }
): Promise<BoostRecipientInfo[]> => {
    const query = new QueryBuilder().match({
        related: [
            { identifier: 'source', model: Boost, where: { id: boost.id } },
            {
                ...Credential.getRelationshipByAlias('instanceOf'),
                identifier: 'instanceOf',
                direction: 'in',
            },
            { identifier: 'credential', model: Credential },
            {
                ...Credential.getRelationshipByAlias('credentialReceived'),
                identifier: 'received',
            },
            {
                identifier: 'recipient',
                model: Profile,
            },
        ],
    });

    const results = convertQueryResultToPropertiesObjectArray<{
        recipient: ProfileInstance;
        received: CredentialRelationships['credentialReceived']['RelationshipProperties'];
    }>(
        await query
            .return('received, recipient')
            .limit(limit)
            .skip(skip ?? 0)
            .run()
    );

    return results.map(({ received, recipient }) => ({
        to: recipient,
        from: received.from,
        received: received.date,
    }));
};
