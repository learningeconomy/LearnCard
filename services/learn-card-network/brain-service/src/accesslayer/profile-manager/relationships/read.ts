import { QueryBuilder } from 'neogma';
import { Boost, Profile, ProfileManager } from '@models';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { ProfileType, FlatProfileType } from 'types/profile';

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
