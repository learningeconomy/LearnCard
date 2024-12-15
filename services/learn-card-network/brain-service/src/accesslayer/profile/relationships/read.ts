import { Op, QueryBuilder, Where } from 'neogma';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { Profile, ProfileManager } from '@models';
import { FlatProfileType, ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';

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
        managed: FlatProfileType;
    }>(await query.return('managed').orderBy('managed.profileId').limit(limit).run());

    return results.map(({ managed }) => inflateObject(managed as any));
};

export const getProfilesThatManageAProfile = async (profileId: string): Promise<ProfileType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{ manager: FlatProfileType }>(
        await new QueryBuilder()
            .match({
                optional: true,
                related: [
                    { model: Profile, where: { profileId } },
                    Profile.getRelationshipByAlias('managedBy'),
                    { identifier: 'directManager', model: Profile },
                ],
            })
            .match({
                optional: true,
                related: [
                    { model: Profile, where: { profileId } },
                    { ...ProfileManager.getRelationshipByAlias('manages'), direction: 'in' },
                    { model: ProfileManager },
                    ProfileManager.getRelationshipByAlias('administratedBy'),
                    { model: Profile, identifier: 'manager' },
                ],
            })
            .return('COALESCE(manager, directManager) AS manager')
            .run()
    );

    return results.map(({ manager }) => inflateObject(manager as any));
};
