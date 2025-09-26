import { QueryBuilder, BindParam } from 'neogma';
import { Integration, Profile, SigningAuthority } from '@models';
import { inflateObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';

export const isIntegrationAssociatedWithProfile = async (
    integrationId: string,
    profileId: string
): Promise<boolean> => {
    const result = await new QueryBuilder()
        .match({ model: Integration, identifier: 'integration', where: { id: integrationId } })
        .match({
            related: [
                { identifier: 'integration' },
                Integration.getRelationshipByAlias('createdBy'),
                { model: Profile, where: { profileId } },
            ],
        })
        .return('integration')
        .limit(1)
        .run();

    return result.records.length > 0;
};

export const isIntegrationUsingSigningAuthority = async (
    integrationId: string,
    signingAuthorityEndpoint: string,
    name?: string
): Promise<boolean> => {
    const qb = new QueryBuilder(
        new BindParam({ integrationId, signingAuthorityEndpoint, name })
    )
        .match({ model: Integration, identifier: 'integration' })
        .where('integration.id = $integrationId')
        .match({ model: SigningAuthority, identifier: 'signingAuthority' })
        .where('signingAuthority.endpoint = $signingAuthorityEndpoint')
        .match('(integration)-[rel:USES_SIGNING_AUTHORITY]->(signingAuthority)');

    const result = await (name ? qb.where('rel.name = $name') : qb)
        .return('integration')
        .limit(1)
        .run();

    return result.records.length > 0;
};

export const getOwnerProfileForIntegration = async (
    integrationId: string
): Promise<ProfileType | null> => {
    const result = await new QueryBuilder(new BindParam({ integrationId }))
        .match({ model: Integration, identifier: 'integration', where: { id: integrationId } })
        .match({
            related: [
                { identifier: 'integration' },
                Integration.getRelationshipByAlias('createdBy'),
                { model: Profile, identifier: 'profile' },
            ],
        })
        .return('profile')
        .limit(1)
        .run();

    const profile = result.records[0]?.get('profile')?.properties;

    if (!profile) return null;

    return inflateObject<ProfileType>(profile as any);
};