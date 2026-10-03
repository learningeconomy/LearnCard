import { QueryBuilder, BindParam } from 'neogma';

import { ConsentFlowContract } from '@models';
import { ConsentFlowContract as ConsentFlowContractType } from '@learncard/types';
import { v4 as uuid } from 'uuid';
import { TRPCError } from '@trpc/server';
import { DbContractType } from 'types/consentflowcontract';
import { flattenObject, inflateObject } from '@helpers/objects.helpers';

export const createConsentFlowContract = async ({
    contract,
    ownerProfileId,
    recipientIds = [],
    writerIds = [],
    autoboosts = [],
    name,
    subtitle = '',
    description = '',
    reasonForAccessing = '',
    needsGuardianConsent = false,
    redirectUrl = '',
    frontDoorBoostUri = '',
    image = '',
    expiresAt,
}: {
    contract: ConsentFlowContractType;
    ownerProfileId: string;
    recipientIds?: string[];
    writerIds?: string[];
    autoboosts?: { id: string; signingAuthorityEndpoint: string; signingAuthorityName: string }[];
    name: string;
    subtitle?: string;
    description?: string;
    reasonForAccessing?: string;
    needsGuardianConsent?: boolean;
    redirectUrl?: string;
    frontDoorBoostUri?: string;
    image?: string;
    expiresAt?: string;
}): Promise<DbContractType> => {
    const id = uuid();
    const createdAt = new Date().toISOString();
    const uniqueRecipientIds = [...new Set(recipientIds)].filter(id => id !== ownerProfileId);
    const uniqueWriterIds = [...new Set(writerIds)];
    const autoBoostsById = new Map<string, (typeof autoboosts)[number]>();
    for (const config of autoboosts) {
        const existing = autoBoostsById.get(config.id);
        if (
            existing &&
            (existing.signingAuthorityEndpoint !== config.signingAuthorityEndpoint ||
                existing.signingAuthorityName !== config.signingAuthorityName)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Conflicting signing authorities for autoboost: ${config.id}`,
            });
        }
        autoBoostsById.set(config.id, config);
    }
    // One configured template produces one issuance per consent/update.
    const uniqueAutoBoosts = [...autoBoostsById.values()];

    const query = new QueryBuilder(
        new BindParam({
            ownerProfileId,
            recipientIds: uniqueRecipientIds,
            writerIds: uniqueWriterIds,
            boostIds: uniqueAutoBoosts.map(boost => boost.id),
            autoboosts: uniqueAutoBoosts,
            createdAt,
            params: flattenObject({
                id,
                name,
                subtitle,
                description,
                reasonForAccessing,
                needsGuardianConsent,
                redirectUrl,
                frontDoorBoostUri,
                image,
                contract,
                createdAt,
                updatedAt: createdAt,
                audienceVersion: uniqueRecipientIds.length,
                expiresAt,
            }),
        })
    )
        // Resolve every target before writing; a missing target produces no writes.
        // One Cypher statement also rolls back the entire configuration on a write failure.
        .raw(
            `
            MATCH (owner:Profile {profileId: $ownerProfileId})
            OPTIONAL MATCH (recipient:Profile) WHERE recipient.profileId IN $recipientIds
            WITH owner, collect(DISTINCT recipient) AS recipients
            WHERE size(recipients) = size($recipientIds)
            OPTIONAL MATCH (writer:Profile) WHERE writer.profileId IN $writerIds
            WITH owner, recipients, collect(DISTINCT writer) AS writers
            WHERE size(writers) = size($writerIds)
            OPTIONAL MATCH (boost:Boost) WHERE boost.id IN $boostIds
            WITH owner, recipients, writers, collect(DISTINCT boost) AS boosts
            WHERE size(boosts) = size($boostIds)
        `
        )
        .create({ model: ConsentFlowContract, identifier: 'contract' })
        .set('contract += $params')
        .raw(
            `
            CREATE (contract)-[:CREATED_BY]->(owner)
            FOREACH (recipient IN recipients |
                CREATE (contract)-[:SHARES_DATA_WITH {addedAt: $createdAt}]->(recipient))
            FOREACH (writer IN writers | CREATE (contract)-[:CAN_WRITE]->(writer))
            FOREACH (config IN $autoboosts |
                FOREACH (boost IN [target IN boosts WHERE target.id = config.id] |
                    CREATE (contract)-[:AUTO_RECEIVE {
                        signingAuthorityEndpoint: config.signingAuthorityEndpoint,
                        signingAuthorityName: config.signingAuthorityName,
                        issuer: $ownerProfileId
                    }]->(boost)))
        `
        )
        .return('contract');

    const result = await query.run();
    const created = result.records[0]?.toObject().contract;
    if (!created) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Could not find all contract configuration targets',
        });
    }
    return inflateObject<DbContractType>(created.properties);
};
