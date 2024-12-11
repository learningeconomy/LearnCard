import { QueryBuilder, BindParam } from 'neogma';
import { flattenObject } from '@helpers/objects.helpers';
import { Profile } from '@models';
import { ProfileType } from 'types/profile';

export const updateProfile = async (profile: ProfileType, updates: Partial<ProfileType>) => {
    const currentDisplay = profile.display;
    const newDisplay = { ...(currentDisplay || {}), ...(updates.display || {}) };

    const newUpdates = flattenObject<Partial<ProfileType>>({
        ...updates,
        ...((currentDisplay || newDisplay) && { display: newDisplay }),
    });

    const query = new QueryBuilder(new BindParam({ params: newUpdates }))
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .set('profile += $params');

    const result = await query.run();

    return result.summary.updateStatistics.containsUpdates();
};
