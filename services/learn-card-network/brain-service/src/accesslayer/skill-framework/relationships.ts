import { QueryBuilder } from 'neogma';

import { neogma } from '@instance';
import { Profile, SkillFramework } from '@models';
import { convertQueryResultToPropertiesObjectArray } from '@helpers/neo4j.helpers';
import { ProfileType } from 'types/profile';

export const listFrameworkManagers = async (frameworkId: string): Promise<ProfileType[]> => {
    const results = convertQueryResultToPropertiesObjectArray<{ admin: ProfileType }>(
        await new QueryBuilder()
            .match({
                related: [
                    { identifier: 'admin', model: Profile },
                    { name: 'MANAGES', direction: 'out' },
                    { model: SkillFramework, where: { id: frameworkId } },
                ],
            })
            .return('admin')
            .orderBy('admin.profileId')
            .run()
    );

    return results.map(({ admin }) => admin);
};

export const addFrameworkManager = async (
    frameworkId: string,
    profileId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})
         MATCH (p:Profile {profileId: $profileId})
         MERGE (p)-[r:MANAGES]->(f)
         RETURN r`,
        { frameworkId, profileId }
    );

    return Boolean(result.records[0]?.get('r'));
};

export const removeFrameworkManager = async (
    frameworkId: string,
    profileId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})
         OPTIONAL MATCH (p:Profile {profileId: $profileId})-[r:MANAGES]->(f)
         WITH f, r
         OPTIONAL MATCH (f)<-[:MANAGES]-(other:Profile)
         WITH f, r, COUNT(other) AS currentCount
         WHERE r IS NOT NULL AND currentCount > 1
         DELETE r
         RETURN true AS deleted`,
        { frameworkId, profileId }
    );

    return Boolean(result.records[0]?.get('deleted'));
};
