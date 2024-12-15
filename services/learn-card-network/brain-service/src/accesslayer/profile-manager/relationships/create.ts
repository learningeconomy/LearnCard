import { Profile, ProfileManager } from '@models';
import { QueryBuilder } from 'neogma';

export const createManagesRelationship = async (
    managerId: string,
    profileId: string
): Promise<boolean> => {
    await new QueryBuilder()
        .match({ model: ProfileManager, identifier: 'manager', where: { id: managerId } })
        .match({ model: Profile, identifier: 'profile', where: { profileId } })
        .create({
            related: [
                { identifier: 'manager' },
                ProfileManager.getRelationshipByAlias('manages'),
                { identifier: 'profile' },
            ],
        })
        .run();

    return true;
};
