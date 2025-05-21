import { BindParam, QueryBuilder } from 'neogma';
import { Boost, Profile, ProfileManager } from '@models';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    getMatchQueryWhere,
} from '@helpers/neo4j.helpers';
import { ProfileType, FlatProfileType } from 'types/profile';
import { ProfileManagerType } from 'types/profile-manager';
import { LCNProfileQuery } from '@learncard/types';
import { inflateObject } from '@helpers/objects.helpers';

export const getProfilesThatAdministrateAProfileManager = async (
    id: string
): Promise<ProfileType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        administrator: FlatProfileType;
    }>(
        await new QueryBuilder()
            .match({ model: ProfileManager, where: { id }, identifier: 'manager' })
            .match({
                optional: true,
                related: [
                    { identifier: 'manager' },
                    { ...ProfileManager.getRelationshipByAlias('administratedBy'), minHops: 1, maxHops: Infinity },
                    { identifier: 'administrator', model: Profile },
                ],
            })
            .match({
                optional: true,
                related: [
                    { identifier: 'manager' },
                    { ...ProfileManager.getRelationshipByAlias('childOf'), minHops: 1, maxHops: Infinity },
                    { model: Boost },
                    { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                    { identifier: 'implicitAdministrator', model: Profile },
                ],
            })
            .match({ optional: true, literal: '(role:Role {id: hasRole.roleId})' })
            .with(
                'administrator, implicitAdministrator, COALESCE(hasRole.canManageChildrenProfiles, role.canManageChildrenProfiles) AS canManageChildrenProfiles'
            )
            .where(
                `
(administrator IS NOT NULL AND implicitAdministrator IS NULL) OR 
administrator = implicitAdministrator OR 
(implicitAdministrator IS NOT NULL AND canManageChildrenProfiles = true)
`
            )
            .return('DISTINCT COALESCE(implicitAdministrator, administrator) AS administrator')
            .run()
    );

    return results.map(({ administrator }) => administrator).filter(Boolean);
};

export const getManagedProfiles = async (
    manager: ProfileManagerType,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: {
        limit: number;
        cursor?: string;
        query?: LCNProfileQuery;
    }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            related: [
                { model: ProfileManager, where: { id: manager.id } },
                ProfileManager.getRelationshipByAlias('manages'),
                { model: Profile, identifier: 'profile' },
            ],
        })
        .where(getMatchQueryWhere('profile'));

    const query = cursor ? _query.raw('AND profile.profileId > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        profile: FlatProfileType;
    }>(await query.return('DISTINCT profile').orderBy('profile.profileId').limit(limit).run());

    return results.map(result => inflateObject(result.profile as any));
};
