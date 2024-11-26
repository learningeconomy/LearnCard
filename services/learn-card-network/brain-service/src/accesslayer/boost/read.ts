import { BindParam, Op, QueryBuilder } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
} from '@helpers/neo4j.helpers';
import { Boost, Profile, BoostInstance, ProfileInstance } from '@models';
import { BoostType } from 'types/boost';
import { BoostQuery } from '@learncard/types';
import { MATCH_QUERY_WHERE } from 'src/constants/neo4j';
import { inflateObject } from '@helpers/objects.helpers';

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
    profile: ProfileInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: BoostQuery }
): Promise<Array<BoostType & { created: string }>> => {
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasRole'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .match({
            related: [
                { identifier: 'boost' },
                `-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile },
            ],
        })
        .where(MATCH_QUERY_WHERE);

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
        ...inflateObject(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostsForProfile = async (
    profile: ProfileInstance,
    { query: matchQuery = {} }: { query?: BoostQuery }
): Promise<number> => {
    const query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasRole'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(MATCH_QUERY_WHERE);

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
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
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
        .match({
            related: [
                { identifier: 'boost' },
                `-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile },
            ],
        })
        .where(MATCH_QUERY_WHERE);

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
        ...inflateObject(result.boost as any),
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
    const query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
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
        .where(MATCH_QUERY_WHERE);

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
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('parentOf'), direction: 'in' },
                { model: Boost },
                { ...Boost.getRelationshipByAlias('parentOf') },
                { identifier: 'boost', model: Boost },
            ],
        })
        .match({
            related: [
                { identifier: 'boost' },
                `-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile },
            ],
        })
        .where(MATCH_QUERY_WHERE);

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
        ...inflateObject(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countBoostSiblings = async (
    boost: BoostInstance,
    { query: matchQuery = {} }: { query?: BoostQuery }
): Promise<number> => {
    const query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('parentOf'), direction: 'in' },
                { model: Boost },
                { ...Boost.getRelationshipByAlias('parentOf') },
                { identifier: 'boost', model: Boost },
            ],
        })
        .where(MATCH_QUERY_WHERE);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

export const getFamilialBoosts = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        query: matchQuery = {},
        parentGenerations = 1,
        childGenerations = 1,
    }: {
        limit: number;
        cursor?: string;
        query?: BoostQuery;
        parentGenerations?: number;
        childGenerations?: number;
    }
): Promise<Array<BoostType & { created: string }>> => {
    // Theoretically these should never _not_ be a number, but because we are interpolating them into
    // the cypher string, it's good to sanitize them anyways
    if (typeof parentGenerations !== 'number' || typeof childGenerations !== 'number') {
        throw new Error(
            `Attempted Injection attack! parentGenerations: ${parentGenerations}, childGenerations: ${childGenerations}`
        );
    }

    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .match({ model: Boost, identifier: 'boost' })
        .where(
            `
((start)<-[:PARENT_OF*1..${Number.isFinite(parentGenerations) ? parentGenerations : ''}]-(boost) OR 
(start)-[:PARENT_OF*1..${Number.isFinite(childGenerations) ? childGenerations : ''}]->(boost) OR 
(start)<-[:PARENT_OF]-(:Boost)-[:PARENT_OF]->(boost) AND boost <> start)
AND ${MATCH_QUERY_WHERE}`
        )
        .match({
            related: [
                { identifier: 'boost' },
                { ...Boost.getRelationshipByAlias('createdBy'), identifier: 'createdBy' },
                { model: Profile },
            ],
        });

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
        ...inflateObject(result.boost as any),
        created: result.createdBy.date,
    }));
};

export const countFamilialBoosts = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        parentGenerations = 1,
        childGenerations = 1,
    }: { query?: BoostQuery; parentGenerations?: number; childGenerations?: number }
): Promise<number> => {
    // Theoretically these should never _not_ be a number, but because we are interpolating them into
    // the cypher string, it's good to sanitize them anyways
    if (typeof parentGenerations !== 'number' || typeof childGenerations !== 'number') {
        throw new Error(
            `Attempted Injection attack! parentGenerations: ${parentGenerations}, childGenerations: ${childGenerations}`
        );
    }

    const query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
        .match({ model: Boost, where: { id: boost.id }, identifier: 'start' })
        .match({ model: Boost, identifier: 'boost' })
        .where(
            `
((start)<-[:PARENT_OF*1..${Number.isFinite(parentGenerations) ? parentGenerations : ''}]-(boost) OR 
(start)-[:PARENT_OF*1..${Number.isFinite(childGenerations) ? childGenerations : ''}]->(boost) OR 
(start)<-[:PARENT_OF]-(:Boost)-[:PARENT_OF]->(boost) AND boost <> start)
AND ${MATCH_QUERY_WHERE}`
        );

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
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
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
        .match({
            related: [
                { identifier: 'boost' },
                `-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile },
            ],
        })
        .where(MATCH_QUERY_WHERE);

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
        ...inflateObject(result.boost as any),
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
    const query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery) })
    )
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
        .where(MATCH_QUERY_WHERE);

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};
