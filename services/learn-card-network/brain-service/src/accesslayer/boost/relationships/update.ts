import { BoostPermissions } from '@learncard/types';
import { BoostInstance } from '@models';
import { ProfileType } from 'types/profile';

export const updateBoostPermissions = async (
    profile: ProfileType,
    boost: BoostInstance,
    permissions: Partial<BoostPermissions>
): Promise<boolean> => {
    const result = await boost.updateRelationship(permissions, {
        alias: 'hasRole',
        where: { target: { profileId: profile.profileId } },
    });

    return result.summary.counters.updates().propertiesSet > 0;
};
