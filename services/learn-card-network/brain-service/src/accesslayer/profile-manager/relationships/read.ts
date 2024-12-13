import { Profile, ProfileManager } from '@models';
import { QueryBuilder } from 'neogma';

import { ProfileType } from 'types/profile';

export const getProfileByManagerId = async (id: string): Promise<ProfileType | null> => {
    const result = await new QueryBuilder()
        .match({
            related: [
                { model: ProfileManager, where: { id } },
                ProfileManager.getRelationshipByAlias('manages'),
                { model: Profile, identifier: 'profile' },
            ],
        })
        .return('profile')
        .limit(1)
        .run();

    return result.records[0]?.get('profile');
};
