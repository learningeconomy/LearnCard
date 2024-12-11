import { Profile } from '@models';
import { ProfileType } from 'types/profile';

export const createProfileManagedByRelationship = async (
    manager: ProfileType,
    managee: ProfileType
): Promise<boolean> => {
    return Boolean(
        await Profile.relateTo({
            alias: 'managedBy',
            where: {
                source: { profileId: managee.profileId },
                target: { profileId: manager.profileId },
            },
        })
    );
};
