import { Op, QueryBuilder, Where } from 'neogma';

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

export const getBoostsForProfile = async (
    profile: ProfileInstance,
    { limit, cursor }: { limit: number; cursor?: string }
): Promise<Array<BoostType & { created: string }>> => {
    const _query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                `-[:${Profile.getRelationshipByAlias('adminOf').name}|${Boost.getRelationshipByAlias('createdBy').name
                }]-`,
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .match({
            related: [
                { identifier: 'boost' },
                `-[createdBy:${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile },
            ],
        });

    const query = cursor
        ? _query.where(
            new Where({ createdBy: { date: { [Op.lt]: cursor } } }, _query.getBindParam())
        )
        : _query;

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

interface ProfileInstanceWithCountBoosts extends ProfileInstance {
    countBoosts: () => Promise<number>;
}

export const countBoostsForProfile = async (
    profile: ProfileInstance
): Promise<number> => {
    const query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'boost', model: Boost },
                `-[:${Profile.getRelationshipByAlias('adminOf').name}|${Boost.getRelationshipByAlias('createdBy').name}]-`,
                { model: Profile, where: { profileId: profile.profileId } },
            ],
        });

    const result = await query.return('COUNT(DISTINCT boost) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};
