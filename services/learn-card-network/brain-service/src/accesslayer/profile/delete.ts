import { ProfileInstance } from '@models';

export const deleteProfile = async (profile: ProfileInstance): Promise<void> => {
    await profile.delete();
};
