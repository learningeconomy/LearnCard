import { QueryBuilder, BindParam } from 'neogma';
import { Integration, Profile } from '@models';

export const deleteIntegrationProfileRelationship = async (
    integrationId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder(new BindParam({ integrationId, profileId }))
        .match({ model: Integration, identifier: 'integration' })
        .where('integration.id = $integrationId')
        .match({ model: Profile, identifier: 'profile' })
        .where('profile.profileId = $profileId')
        .match('(integration)-[rel:CREATED_BY]->(profile)')
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};
