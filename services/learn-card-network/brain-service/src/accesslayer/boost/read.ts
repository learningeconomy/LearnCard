import { BindParam, Op, QueryBuilder } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    buildWhereForQueryBuilder,
} from '@helpers/neo4j.helpers';
import { Boost, Profile, BoostInstance, ProfileManager } from '@models';
import { BoostType } from 'types/boost';
import { BoostQuery, LCNProfileManager, LCNProfileManagerQuery } from '@learncard/types';
import { inflateObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';
import { ProfileManagerType } from 'types/profile-manager';

export const getBoostById = async (id: string): Promise<BoostInstance | null> => {
    return Boost.findOne({ where: { id } });
};

export const getBoostByUri = async (uri: string): Promise<BoostInstance | null> => {
    const id = getIdFromUri(uri);

    return Boost.findOne({ where: { id } });
};

export const getBoostsByUri = async (uris: string[]): Promise<BoostInstance[]> => {
    const ids = uris.map(uri => getIdFromUri(uri));

    return Boost.findMany({ where: { id: { [Op.in]: ids } } });
};

export const getBoostsForProfile = async (
    profile: ProfileType,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: BoostQuery }
): Promise<Array<BoostType & { created: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasRole'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .raw(`MATCH (boost)-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-()`)
        .where(whereClause);

    const query = cursor ? _query.raw('AND createdBy.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        createdBy: { date: string };
    }>(
        await query
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostsForProfile = async (
    profile: ProfileType,
    { query: matchQuery = {} }: { query?: BoostQuery }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const query = new QueryBuilder(new BindParam({ ...queryParams }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasRole'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(whereClause);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getChildrenBoosts = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: {
        limit: number;
        cursor?: string;
        query?: BoostQuery;
        numberOfGenerations?: number;
    }
): Promise<Array<BoostType & { created: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    maxHops: numberOfGenerations,
                },
                { identifier: 'boost', model: Boost },
            ],
        })
        .raw(`MATCH (boost)-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-()`)
        .where(whereClause);

    const query = cursor ? _query.raw('AND createdBy.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        createdBy: { date: string };
    }>(
        await query
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostChildren = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: { query?: BoostQuery; numberOfGenerations?: number }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const query = new QueryBuilder(new BindParam({ ...queryParams }))
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    maxHops: numberOfGenerations,
                },
                { identifier: 'boost', model: Boost },
            ],
        })
        .where(whereClause);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getSiblingBoosts = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: {
        limit: number;
        cursor?: string;
        query?: BoostQuery;
    }
): Promise<Array<BoostType & { created: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('parentOf'), direction: 'in' },
                { model: Boost },
                { ...Boost.getRelationshipByAlias('parentOf') },
                { identifier: 'boost', model: Boost },
            ],
        })
        .raw(`MATCH (boost)-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-()`)
        .where(whereClause);

    const query = cursor ? _query.raw('AND createdBy.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        createdBy: { date: string };
    }>(
        await query
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostSiblings = async (
    boost: BoostInstance,
    { query: matchQuery = {} }: { query?: BoostQuery }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const query = new QueryBuilder(new BindParam({ ...queryParams }))
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('parentOf'), direction: 'in' },
                { model: Boost },
                { ...Boost.getRelationshipByAlias('parentOf') },
                { identifier: 'boost', model: Boost },
            ],
        })
        .where(whereClause);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

/**
 * Builds the Cypher (to follow `MATCH (start:Boost { id })`) that binds `boost` to every distinct
 * member of start's family: ancestors (up to parentGenerations), descendants (up to
 * childGenerations) and siblings (or, with includeExtendedFamily, cousins), never start itself
 * via the sibling path.
 *
 * Each branch is expanded outward from the already-bound `start` node, so the cost is proportional
 * to the size of the family. The previous form (`MATCH (boost:Boost) WHERE <pattern> OR <pattern>`)
 * label-scanned every Boost node and evaluated the pattern predicates per node.
 *
 * Generations are interpolated (Cypher cannot parameterise variable-length bounds); callers must
 * validate they are numbers. Non-finite values produce an unbounded range, matching prior behaviour.
 */
const getFamilialBoostsCypher = ({
    parentGenerations,
    childGenerations,
    includeExtendedFamily,
}: {
    parentGenerations: number;
    childGenerations: number;
    includeExtendedFamily: boolean;
}): string => {
    const parentRange = Number.isFinite(parentGenerations) ? parentGenerations : '';
    const childRange = Number.isFinite(childGenerations) ? childGenerations : '';
    const siblingParentHops = includeExtendedFamily ? `*1..${parentRange}` : '';
    const siblingChildHops = includeExtendedFamily ? `*1..${childRange}` : '';

    return `
OPTIONAL MATCH (start)<-[:PARENT_OF*1..${parentRange}]-(ancestor:Boost)
WITH start, COLLECT(DISTINCT ancestor) AS ancestors
OPTIONAL MATCH (start)-[:PARENT_OF*1..${childRange}]->(descendant:Boost)
WITH start, ancestors, COLLECT(DISTINCT descendant) AS descendants
OPTIONAL MATCH (start)<-[:PARENT_OF${siblingParentHops}]-(:Boost)-[:PARENT_OF${siblingChildHops}]->(sibling:Boost)
WHERE sibling <> start
WITH ancestors, descendants, COLLECT(DISTINCT sibling) AS siblings
UNWIND ancestors + descendants + siblings AS boost
WITH DISTINCT boost`;
};

export const getFamilialBoosts = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
        parentGenerations = 1,
        childGenerations = 1,
        includeExtendedFamily = false,
    }: {
        limit: number;
        cursor?: string;
        query?: BoostQuery;
        parentGenerations?: number;
        childGenerations?: number;
        includeExtendedFamily?: boolean;
    }
): Promise<Array<BoostType & { created: string }>> => {
    // Theoretically these should never _not_ be a number, but because we are interpolating them into
    // the cypher string, it's good to sanitize them anyways
    if (typeof parentGenerations !== 'number' || typeof childGenerations !== 'number') {
        throw new Error(
            `Attempted Injection attack! parentGenerations: ${parentGenerations}, childGenerations: ${childGenerations}`
        );
    }

    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .raw(
            getFamilialBoostsCypher({ parentGenerations, childGenerations, includeExtendedFamily })
        )
        .where(whereClause)
        .raw(`MATCH (boost)-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-()`);

    const query = cursor ? _query.where('createdBy.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        createdBy: { date: string };
    }>(
        await query
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countFamilialBoosts = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        parentGenerations = 1,
        childGenerations = 1,
        includeExtendedFamily = false,
    }: {
        query?: BoostQuery;
        parentGenerations?: number;
        childGenerations?: number;
        includeExtendedFamily?: boolean;
    }
): Promise<number> => {
    // Theoretically these should never _not_ be a number, but because we are interpolating them into
    // the cypher string, it's good to sanitize them anyways
    if (typeof parentGenerations !== 'number' || typeof childGenerations !== 'number') {
        throw new Error(
            `Attempted Injection attack! parentGenerations: ${parentGenerations}, childGenerations: ${childGenerations}`
        );
    }

    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const query = new QueryBuilder(new BindParam({ ...queryParams }))
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .raw(
            getFamilialBoostsCypher({ parentGenerations, childGenerations, includeExtendedFamily })
        )
        .where(whereClause);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getParentBoosts = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: {
        limit: number;
        cursor?: string;
        query?: BoostQuery;
        numberOfGenerations?: number;
    }
): Promise<Array<BoostType & { created: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    maxHops: numberOfGenerations,
                },
                { model: Boost, where: { id: boost.id } },
            ],
        })
        .raw(`MATCH (boost)-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-()`)
        .where(whereClause);

    const query = cursor ? _query.raw('AND createdBy.date < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        boost: BoostType;
        createdBy: { date: string };
    }>(
        await query
            .return('DISTINCT boost, createdBy')
            .orderBy('createdBy.date DESC')
            .limit(limit)
            .run()
    );

    return results.map(result => ({
        ...(inflateObject as any)(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostParents = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: { query?: BoostQuery; numberOfGenerations?: number }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'boost',
        convertedQuery as any
    );

    const query = new QueryBuilder(new BindParam({ ...queryParams }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    maxHops: numberOfGenerations,
                },
                { model: Boost, where: { id: boost.id } },
            ],
        })
        .where(whereClause);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getChildrenProfileManagers = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: {
        limit: number;
        cursor?: string;
        query?: LCNProfileManagerQuery;
    }
): Promise<Array<LCNProfileManager>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder(
        'manager',
        convertedQuery as any
    );

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { identifier: 'manager', model: ProfileManager },
                ProfileManager.getRelationshipByAlias('childOf'),
                { model: Boost, where: { id: boost.id } },
            ],
        })
        .where(whereClause);

    const query = cursor ? _query.raw('AND manager.created < $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        manager: ProfileManagerType;
    }>(await query.return('DISTINCT manager').orderBy('manager.created DESC').limit(limit).run());

    return results.map(result => result.manager);
};
