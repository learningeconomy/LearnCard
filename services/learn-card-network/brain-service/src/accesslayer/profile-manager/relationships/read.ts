import { BindParam, QueryBuilder } from 'neogma';
import { Boost, Profile, ProfileManager } from '@models';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    buildWhereForQueryBuilder,
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
                    ProfileManager.getRelationshipByAlias('administratedBy'),
                    { identifier: 'administrator', model: Profile },
                ],
            })
            .match({
                optional: true,
                related: [
                    { identifier: 'manager' },
                    ProfileManager.getRelationshipByAlias('childOf'),
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

export const getProfilesManagedByProfile = async (
    profileId: string
): Promise<ProfileType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        child: FlatProfileType;
    }>(
        await new QueryBuilder(new BindParam({ profileId }))
            .match({
                related: [
                    { model: Profile, where: { profileId }, identifier: 'guardian' },
                    {
                        ...ProfileManager.getRelationshipByAlias('administratedBy'),
                        direction: 'in',
                    },
                    { model: ProfileManager, identifier: 'pm' },
                    ProfileManager.getRelationshipByAlias('manages'),
                    { model: Profile, identifier: 'child' },
                ],
            })
            .return('DISTINCT child')
            .run()
    );

    return results.map(result => inflateObject(result.child as any));
};

/**
 * Checks whether a guardian profile has a MANAGES relationship with a child profile.
 * Traverses: (guardian:Profile)<-[:ADMINISTRATED_BY]-(pm:ProfileManager)-[:MANAGES]->(child:Profile)
 */
export const doesProfileManageProfile = async (
    guardianProfileId: string,
    childProfileId: string
): Promise<boolean> => {
    const results = convertQueryResultToPropertiesObjectArray<{
        pm: { id: string };
    }>(
        await new QueryBuilder(new BindParam({ guardianProfileId, childProfileId }))
            .match({
                related: [
                    { model: Profile, where: { profileId: guardianProfileId }, identifier: 'guardian' },
                    {
                        ...ProfileManager.getRelationshipByAlias('administratedBy'),
                        direction: 'in',
                    },
                    { model: ProfileManager, identifier: 'pm' },
                    ProfileManager.getRelationshipByAlias('manages'),
                    { model: Profile, where: { profileId: childProfileId }, identifier: 'child' },
                ],
            })
            .return('pm')
            .limit(1)
            .run()
    );

    return results.length > 0;
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
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder('profile', convertedQuery as any);
    
    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { model: ProfileManager, where: { id: manager.id } },
                ProfileManager.getRelationshipByAlias('manages'),
                { model: Profile, identifier: 'profile' },
            ],
        })
        .where(whereClause);

    const query = cursor ? _query.raw('AND profile.profileId > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        profile: FlatProfileType;
    }>(await query.return('DISTINCT profile').orderBy('profile.profileId').limit(limit).run());

    return results.map(result => inflateObject(result.profile as any));
};
