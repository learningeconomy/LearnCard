import { BindParam, QueryBuilder } from 'neogma';

import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    buildWhereForQueryBuilder,
} from '@helpers/neo4j.helpers';
import { Boost, ClaimHook, Role } from '@models';
import { BoostType } from 'types/boost';
import { ClaimHookQuery, FullClaimHook } from '@learncard/types';
import { ClaimHook as ClaimHookType } from 'types/claim-hook';
import { Role as RoleType } from 'types/role';
import { getBoostUri } from '@helpers/boost.helpers';

export const getClaimHookById = async (id: string): Promise<ClaimHookType | null> => {
    return ClaimHook.findOne({ where: { id } });
};

export const getClaimHooksForBoost = async (
    boost: BoostType,
    {
        domain,
        limit,
        cursor,
        query: matchQuery = {},
    }: { domain: string; limit: number; cursor?: string; query?: ClaimHookQuery }
): Promise<FullClaimHook[]> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder('hook', convertedQuery as any);
    
    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { model: Boost, identifier: 'target' },
                { ...ClaimHook.getRelationshipByAlias('target'), direction: 'in' },
                { identifier: 'hook', model: ClaimHook },
                ClaimHook.getRelationshipByAlias('hookFor'),
                { model: Boost, where: { id: boost.id } },
            ],
        })
        .match({
            related: [
                { identifier: 'hook' },
                ClaimHook.getRelationshipByAlias('roleToGrant'),
                { model: Role, identifier: 'roleToGrant' },
            ],
        })
        .where(whereClause);

    const query = cursor ? _query.raw('AND hook.updatedAt < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        target: BoostType;
        hook: ClaimHookType;
        roleToGrant: RoleType;
    }>(
        await query
            .return('DISTINCT hook, target, roleToGrant')
            .orderBy('hook.updatedAt DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...result.hook,
        data: {
            claimUri: getBoostUri(boost.id, domain),
            targetUri: getBoostUri(result.target.id, domain),
            permissions: result.roleToGrant,
        },
    }));
};
