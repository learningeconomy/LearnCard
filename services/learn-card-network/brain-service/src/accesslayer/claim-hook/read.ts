import { BindParam, QueryBuilder } from 'neogma';

import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    getMatchQueryWhere,
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
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
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
        .where(getMatchQueryWhere('hook'));

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
