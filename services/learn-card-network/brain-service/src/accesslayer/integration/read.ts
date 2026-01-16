import { BindParam, QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';

import { inflateObject } from '@helpers/objects.helpers';
import { Integration } from '@models';
import { IntegrationType } from 'types/integration';
import { ProfileType } from 'types/profile';
import {
    convertObjectRegExpToNeo4j,
    buildWhereClause,
} from '@helpers/neo4j.helpers';
import { LCNIntegrationQueryType } from '@learncard/types';
import { neogma } from '@instance';

/**
 * Parse guideState from JSON string to object if present
 */
const parseIntegration = (integration: IntegrationType): IntegrationType => {
    if (integration.guideState && typeof integration.guideState === 'string') {
        try {
            return { ...integration, guideState: JSON.parse(integration.guideState) };
        } catch {
            return integration;
        }
    }

    return integration;
};

export const readIntegrationById = async (id: string): Promise<IntegrationType | null> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: Integration, identifier: 'integration', where: { id } })
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return parseIntegration(inflateObject<IntegrationType>(integration as any));
};

export const readIntegrationByPublishableKey = async (publishableKey: string): Promise<IntegrationType | null> => {
    const result = await new QueryBuilder(new BindParam({ publishableKey }))
        .match({ model: Integration, identifier: 'integration', where: { publishableKey } })
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return parseIntegration(inflateObject<IntegrationType>(integration as any));
};

export const readIntegrationByName = async (name: string): Promise<IntegrationType | null> => {
    const result = await new QueryBuilder(new BindParam({ name }))
        .match({ model: Integration, identifier: 'integration', where: { name } })
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return parseIntegration(inflateObject<IntegrationType>(integration as any));
};

export const getIntegrationsForProfile = async (
    profile: Pick<ProfileType, 'profileId'>,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: LCNIntegrationQueryType }
): Promise<IntegrationType[]> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereClause('integration', convertedQuery as any);

    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})<-[:CREATED_BY]-(integration:Integration)
         WHERE ${whereClause}
         ${cursor ? 'AND integration.id < $cursor' : ''}
         RETURN DISTINCT integration
         ORDER BY integration.id DESC
         LIMIT $limit`,
        {
            profileId: profile.profileId,
            ...queryParams,
            cursor: cursor ?? null,
            limit: int(limit),
        }
    );

    return result.records.map(record => {
        const integration = record.get('integration')?.properties;
        return parseIntegration(inflateObject<IntegrationType>(integration as any));
    });
};

export const countIntegrationsForProfile = async (
    profile: Pick<ProfileType, 'profileId'>,
    { query: matchQuery = {} }: { query?: LCNIntegrationQueryType }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereClause('integration', convertedQuery as any);

    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})<-[:CREATED_BY]-(integration:Integration)
         WHERE ${whereClause}
         RETURN COUNT(DISTINCT integration) AS count`,
        {
            profileId: profile.profileId,
            ...queryParams,
        }
    );

    return Number(result.records[0]?.get('count') ?? 0);
};
