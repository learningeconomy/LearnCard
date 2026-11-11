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

/**
 * Above this many index candidates, `getFamilialBoostsByCandidatesCypher` falls back to expanding
 * the family. At or below it, checking each candidate is cheaper than walking a wide family.
 */
const FAMILIAL_CANDIDATE_LIMIT = 16;

/** Boost properties with a range index (see models/index.ts) */
const INDEXED_BOOST_FIELDS = ['id', 'category', 'autoConnectRecipients'] as const;

/**
 * Finds one top-level condition in a converted BoostQuery that Neo4j can answer from an index:
 * plain equality or `$in` on an indexed Boost property. buildWhereClause ANDs top-level fields
 * together, so every boost the full filter accepts also passes this condition.
 *
 * The value is bound as `$familialProbe`, which can't clash with buildWhereClause's `param_N`.
 */
const getIndexedFamilialProbe = (
    query: Record<string, unknown>
): { predicate: string; value: unknown } | undefined => {
    // A document-level $or makes buildWhereClause ignore the other top-level keys
    if ('$or' in query) return undefined;

    for (const field of INDEXED_BOOST_FIELDS) {
        const value = query[field];

        if (value === undefined) continue;

        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return { predicate: `c.${field} = $familialProbe`, value };
        }

        // Mirrors buildFieldCondition: a field-level $or wins over $in, then $in wins over the rest
        if (!('$or' in value) && '$in' in value && Array.isArray(value.$in)) {
            return { predicate: `c.${field} IN $familialProbe`, value: value.$in };
        }
    }

    return undefined;
};

/**
 * Same contract as `getFamilialBoostsCypher`, for queries with an indexed filter.
 *
 * It first index-seeks up to FAMILIAL_CANDIDATE_LIMIT + 1 boosts that pass the indexed condition.
 * - More than the limit: the family is expanded exactly as in `getFamilialBoostsCypher`.
 * - Otherwise: only those candidates are checked. A candidate is an ancestor if it is in start's
 *   ancestors, a descendant if start is among its own ancestors (walked up from the candidate,
 *   which stays small even under a wide parent), and a sibling via the original pattern.
 *
 * With includeExtendedFamily, the cousin check intersects the candidate's ancestors with start's.
 * That set check can also reach nodes the single-pattern form can't (it ignores relationship
 * uniqueness across the up and down legs), but any such node is already an ancestor or
 * descendant of start as long as every node above start is a Boost. When a non-Boost node sits
 * above start, the original cousin pattern is used instead.
 */
const getFamilialBoostsByCandidatesCypher = ({
    parentGenerations,
    childGenerations,
    includeExtendedFamily,
    probe,
}: {
    parentGenerations: number;
    childGenerations: number;
    includeExtendedFamily: boolean;
    probe: string;
}): string => {
    const p = Number.isFinite(parentGenerations) ? parentGenerations : '';
    const c = Number.isFinite(childGenerations) ? childGenerations : '';
    const up = includeExtendedFamily ? `*1..${p}` : '';
    const down = includeExtendedFamily ? `*1..${c}` : '';
    const k = FAMILIAL_CANDIDATE_LIMIT;
    const sibling = includeExtendedFamily
        ? `(n=size(a) AND any(x IN bu WHERE x IN a) OR n<>size(a) AND EXISTS{(start)<-[:PARENT_OF${up}]-(:Boost)-[:PARENT_OF${down}]->(boost)})`
        : 'EXISTS{(start)<-[:PARENT_OF]-(:Boost)-[:PARENT_OF]->(boost)}';

    return `
CALL{MATCH(c:Boost)WHERE ${probe} WITH c LIMIT ${k + 1} RETURN collect(c)AS cs}
OPTIONAL MATCH(start)<-[:PARENT_OF*1..${p}]-(u)
WITH start,cs,collect(DISTINCT u)AS us
WITH start,cs,size(us)AS n,[x IN us WHERE x:Boost]AS a
CALL{WITH start,cs WITH start WHERE size(cs)>${k}
OPTIONAL MATCH(start)-[:PARENT_OF*1..${c}]->(d:Boost)RETURN collect(DISTINCT d)AS ds}
CALL{WITH start,cs WITH start WHERE size(cs)>${k}
OPTIONAL MATCH(start)<-[:PARENT_OF${up}]-(:Boost)-[:PARENT_OF${down}]->(s:Boost)WHERE s<>start
RETURN collect(DISTINCT s)AS ss}
CALL{WITH start,cs,n,a WITH * WHERE size(cs)<=${k}
UNWIND cs AS boost
OPTIONAL MATCH(boost)<-[:PARENT_OF*1..${c}]-(v)
WITH start,n,a,boost,collect(DISTINCT v)AS bu
WHERE boost IN a OR start IN bu OR boost<>start AND ${sibling}
RETURN collect(boost)AS hits}
UNWIND CASE WHEN size(cs)>${k} THEN a+ds+ss ELSE hits END AS boost
WITH DISTINCT boost`;
};

/** Picks the familial Cypher for a query and returns the extra params it needs */
const getFamilialCypherForQuery = (
    query: Record<string, unknown>,
    generations: {
        parentGenerations: number;
        childGenerations: number;
        includeExtendedFamily: boolean;
    }
): { cypher: string; params: Record<string, unknown> } => {
    const probe = getIndexedFamilialProbe(query);

    if (!probe) return { cypher: getFamilialBoostsCypher(generations), params: {} };

    return {
        cypher: getFamilialBoostsByCandidatesCypher({ ...generations, probe: probe.predicate }),
        params: { familialProbe: probe.value },
    };
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

    const familial = getFamilialCypherForQuery(convertedQuery, {
        parentGenerations,
        childGenerations,
        includeExtendedFamily,
    });

    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams, ...familial.params }))
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .raw(familial.cypher)
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

    const familial = getFamilialCypherForQuery(convertedQuery, {
        parentGenerations,
        childGenerations,
        includeExtendedFamily,
    });

    const query = new QueryBuilder(new BindParam({ ...queryParams, ...familial.params }))
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .raw(familial.cypher)
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
