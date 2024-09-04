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
    const _query = new QueryBuilder().match({
        related: [
            { identifier: 'source', model: Boost },
            `-[relationship:${Profile.getRelationshipByAlias('adminOf').name}|${Boost.getRelationshipByAlias('createdBy').name
            }]-`,
            { model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const query = cursor
        ? _query.where(
            new Where({ relationship: { date: { [Op.gt]: cursor } } }, _query.getBindParam())
        )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        source: BoostType;
        created: string;
    }>(
        await query
            .return('DISTINCT source, relationship.date AS created')
            .orderBy('relationship.date')
            .limit(limit)
            .run()
    );

    return results.map(result => ({ ...result.source, created: result.created }));
};
