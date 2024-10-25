import { BoostPermissions } from '@learncard/types';
import { BoostInstance, ProfileInstance } from '@models';

export const updateBoostPermissions = async (
    profile: ProfileInstance,
    boost: BoostInstance,
    permissions: Partial<BoostPermissions>
): Promise<boolean> => {
    const result = await boost.updateRelationship(permissions, {
        alias: 'hasRole',
        where: { target: { profileId: profile.profileId } },
    });

    return result.summary.counters.updates().propertiesSet > 0;
};
