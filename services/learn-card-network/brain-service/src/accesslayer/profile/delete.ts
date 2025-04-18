import { Profile } from '@models';
import { ProfileType } from 'types/profile';

export const deleteProfile = async (profile: ProfileType): Promise<void> => {
    await Profile.delete({ detach: true, where: { profileId: profile.profileId } });
};
