import { QueryBuilder, BindParam } from 'neogma';
import { Integration, Profile, SigningAuthority } from '@models';

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

export const deleteIntegrationSigningAuthorityRelationship = async (
    integrationId: string,
    signingAuthorityEndpoint: string,
    name?: string
): Promise<boolean> => {
    const qb = new QueryBuilder(new BindParam({ integrationId, signingAuthorityEndpoint, name }))
        .match({ model: Integration, identifier: 'integration' })
        .where('integration.id = $integrationId')
        .match({ model: SigningAuthority, identifier: 'signingAuthority' })
        .where('signingAuthority.endpoint = $signingAuthorityEndpoint')
        .match('(integration)-[rel:USES_SIGNING_AUTHORITY]->(signingAuthority)');

    const result = await (name ? qb.where('rel.name = $name') : qb)
        .delete('rel')
        .run();

    return result.summary.counters.updates().relationshipsDeleted > 0;
};
