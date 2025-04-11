import { Profile, AuthGrant } from '@models';
import { QueryBuilder } from 'neogma';

export const associateAuthGrantWithProfile = async (
    authGrantId: string,
    profileId: string
): Promise<boolean> => {
    await new QueryBuilder()
        .match({ model: AuthGrant, identifier: 'authGrant', where: { id: authGrantId } })
        .match({ model: Profile, identifier: 'profile', where: { profileId } })
        .create({
            related: [
                { identifier: 'authGrant' },
                AuthGrant.getRelationshipByAlias('authorizesAuthGrant'),
                { identifier: 'profile' },
            ],
        })
        .run();

    return true;
};
