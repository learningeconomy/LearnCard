import { QueryBuilder, BindParam } from 'neogma';
import { Integration, Profile } from '@models';
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
