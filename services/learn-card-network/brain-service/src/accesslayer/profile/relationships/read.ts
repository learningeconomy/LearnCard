import { BindParam, Op, QueryBuilder, Where } from 'neogma';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    getMatchQueryWhere,
} from '@helpers/neo4j.helpers';
import { Boost, Profile, ProfileManager } from '@models';
import type { FlatProfileType, ProfileType } from 'types/profile';
import { inflateObject } from '@helpers/objects.helpers';
import type { LCNProfileQuery } from '@learncard/types';
import type { ProfileManagerType } from 'types/profile-manager';

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
            .match({
                optional: true,
                related: [
                    { model: Profile, where: { profileId } },
                    { ...ProfileManager.getRelationshipByAlias('manages'), direction: 'in' },
                    { model: ProfileManager },
                    ProfileManager.getRelationshipByAlias('childOf'),
                    { model: Boost },
                    { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                    { identifier: 'implicitManager', model: Profile },
                ],
            })
            .match({ optional: true, literal: '(role:Role {id: hasRole.roleId})' })
            .with(
                'manager, directManager, implicitManager, COALESCE(hasRole.canManageChildrenProfiles, role.canManageChildrenProfiles) AS canManageChildrenProfiles'
            )
            .where(
                `
(implicitManager IS NULL AND manager IS NOT NULL) OR 
implicitManager = manager OR 
(implicitManager IS NULL AND directManager IS NOT NULL) OR 
implicitManager = directManager OR 
(implicitManager IS NOT NULL AND canManageChildrenProfiles = true)
`
            )
            .return('DISTINCT COALESCE(implicitManager, directManager, manager) AS manager')
            .run()
    );

    return results
        .map(({ manager }) => manager && (inflateObject as any)(manager as any))
        .filter(Boolean);
};

export const getProfilesThatAProfileManages = async (
    profileId: string,
    {
        limit,
        cursor,
        query: matchQuery = {},
    }: { limit: number; cursor?: string; query?: LCNProfileQuery }
): Promise<{ profile: ProfileType; manager?: ProfileManagerType }[]> => {
    const _query = new QueryBuilder(
        new BindParam({ matchQuery: convertObjectRegExpToNeo4j(matchQuery), cursor })
    )
        .match({
            optional: true,
            related: [
                { identifier: 'directlyManaged', model: Profile, where: { profileId } },
                Profile.getRelationshipByAlias('managedBy'),
                { model: Profile, where: { profileId } },
            ],
        })
        .match({
            optional: true,
            related: [
                { identifier: 'managed', model: Profile },
                { ...ProfileManager.getRelationshipByAlias('manages'), direction: 'in' },
                { model: ProfileManager, identifier: 'manager' },
                ProfileManager.getRelationshipByAlias('administratedBy'),
                { model: Profile, where: { profileId } },
            ],
        })
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'implicitlyManaged' },
                { ...ProfileManager.getRelationshipByAlias('manages'), direction: 'in' },
                { model: ProfileManager, identifier: 'implicitManager' },
                ProfileManager.getRelationshipByAlias('childOf'),
                { model: Boost },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { where: { profileId }, model: Profile },
            ],
        })
        .match({ optional: true, literal: '(role:Role {id: hasRole.roleId})' })
        .with(
            'managed, directlyManaged, implicitlyManaged, manager, implicitManager, COALESCE(hasRole.canManageChildrenProfiles, role.canManageChildrenProfiles) AS canManageChildrenProfiles'
        )
        .where(
            `
(implicitlyManaged IS NULL AND managed IS NOT NULL) OR 
implicitlyManaged = managed OR 
(implicitlyManaged IS NULL AND directlyManaged IS NOT NULL) OR 
implicitlyManaged = directlyManaged OR 
(implicitlyManaged IS NOT NULL AND canManageChildrenProfiles = true)
`
        )
        .with(
            'DISTINCT COALESCE(implicitlyManaged, directlyManaged, managed) AS managed, COALESCE(implicitManager, manager) AS manager'
        )
        .where(getMatchQueryWhere('managed'));

    const query = cursor ? _query.raw('AND managed.profileId > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        managed: FlatProfileType;
        manager?: ProfileManagerType;
    }>(await query.return('managed, manager').orderBy('managed.profileId').limit(limit).run());

    return results.map(({ managed, manager }) => ({
        profile: inflateObject(managed as any),
        manager,
    }));
};
