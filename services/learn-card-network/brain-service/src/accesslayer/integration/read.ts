import { BindParam, QueryBuilder } from 'neogma';

import { inflateObject } from '@helpers/objects.helpers';
import { Integration, Profile } from '@models';
import { IntegrationType } from 'types/integration';
import { ProfileType } from 'types/profile';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    getMatchQueryWhere,
} from '@helpers/neo4j.helpers';
import { LCNIntegrationQueryType } from '@learncard/types';

export const readIntegrationById = async (id: string): Promise<IntegrationType | null> => {
    const result = await new QueryBuilder(new BindParam({ id }))
        .match({ model: Integration, identifier: 'integration', where: { id } })
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return inflateObject<IntegrationType>(integration as any);
};

export const readIntegrationByName = async (name: string): Promise<IntegrationType | null> => {
    const result = await new QueryBuilder(new BindParam({ name }))
        .match({ model: Integration, identifier: 'integration', where: { name } })
        .return('integration')
        .limit(1)
        .run();

    const integration = result.records[0]?.get('integration')?.properties;

    if (!integration) return null;

    return inflateObject<IntegrationType>(integration as any);
};

export const getIntegrationsForProfile = async (
    profile: Pick<ProfileType, 'profileId'>,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: LCNIntegrationQueryType }
): Promise<IntegrationType[]> => {
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            related: [
                { identifier: 'integration', model: Integration },
                Integration.getRelationshipByAlias('createdBy'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(getMatchQueryWhere('integration'));

    const query = cursor ? _query.raw('AND integration.id < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        integration: IntegrationType;
    }>(
        await query
            .return('DISTINCT integration')
            .orderBy('integration.id DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => inflateObject<IntegrationType>(result.integration as any));
};

export const countIntegrationsForProfile = async (
    profile: Pick<ProfileType, 'profileId'>,
    { query: matchQuery = {} }: { query?: LCNIntegrationQueryType }
): Promise<number> => {
    const result = await new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
        .match({
            related: [
                { identifier: 'integration', model: Integration },
                Integration.getRelationshipByAlias('createdBy'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(getMatchQueryWhere('integration'))
        .return('COUNT(DISTINCT integration) AS count')
        .run();

    return Number(result.records[0]?.get('count') ?? 0);
};
