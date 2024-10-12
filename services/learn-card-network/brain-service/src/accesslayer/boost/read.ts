import { BindParam, Op, QueryBuilder } from 'neogma';

import { getIdFromUri } from '@helpers/uri.helpers';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Boost, Profile, BoostInstance, ProfileInstance } from '@models';
import { BoostType } from 'types/boost';

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
    }: { limit: number; cursor?: string; query?: Partial<Omit<BoostType, 'id' | 'boost'>> }
): Promise<Array<BoostType & { created: string }>> => {
    const _query = new QueryBuilder(new BindParam({ matchQuery, cursor }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasPermissions'),
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
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

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

    return results.map(result => ({ ...result.boost, created: result.createdBy.date }));
};

export const countBoostsForProfile = async (
    profile: ProfileInstance,
    { query: matchQuery = {} }: { query?: Partial<Omit<BoostType, 'id' | 'boost'>> }
): Promise<number> => {
    const query = new QueryBuilder(new BindParam({ matchQuery }))
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                Boost.getRelationshipByAlias('hasPermissions'),
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

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
        query?: Partial<Omit<BoostType, 'id' | 'boost'>>;
        numberOfGenerations?: number;
    }
): Promise<Array<BoostType & { created: string }>> => {
    const _query = new QueryBuilder(new BindParam({ matchQuery, cursor }))
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
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

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

    return results.map(result => ({ ...result.boost, created: result.createdBy.date }));
};

export const countBoostChildren = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: { query?: Partial<Omit<BoostType, 'id' | 'boost'>>; numberOfGenerations?: number }
): Promise<number> => {
    const query = new QueryBuilder(new BindParam({ matchQuery }))
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
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

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
        query?: Partial<Omit<BoostType, 'id' | 'boost'>>;
        numberOfGenerations?: number;
    }
): Promise<Array<BoostType & { created: string }>> => {
    const _query = new QueryBuilder(new BindParam({ matchQuery, cursor }))
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
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

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

    return results.map(result => ({ ...result.boost, created: result.createdBy.date }));
};

export const countBoostParents = async (
    boost: BoostInstance,
    {
        query: matchQuery = {},
        numberOfGenerations = 1,
    }: { query?: Partial<Omit<BoostType, 'id' | 'boost'>>; numberOfGenerations?: number }
): Promise<number> => {
    const query = new QueryBuilder(new BindParam({ matchQuery }))
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
        .where('all(key IN keys($matchQuery) WHERE boost[key] = $matchQuery[key])');

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};
