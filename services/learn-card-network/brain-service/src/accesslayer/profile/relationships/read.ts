import { Op, QueryBuilder, Where } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

export const getManagedServiceProfiles = async (
    profileId: string,
    { limit, cursor, targetId }: { limit: number; cursor?: string; targetId?: string }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder().match({
        related: [
            {
                identifier: 'managed',
                model: Profile,
                ...(targetId && { where: { profileId: targetId } }),
            },
            Profile.getRelationshipByAlias('managedBy'),
            { identifier: 'manager', model: Profile, where: { profileId: profileId } },
        ],
    });

    const query = cursor
        ? _query.where(
            new Where({ managed: { profileId: { [Op.gt]: cursor } } }, _query.getBindParam())
        )
        : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        managed: ProfileType;
    }>(await query.return('managed').orderBy('managed.profileId').limit(limit).run());

    return results.map(({ managed }) => managed);
};
