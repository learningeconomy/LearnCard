import { ProfileManager } from '@models';
import { ProfileManagerType } from 'types/profile-manager';

export const getProfileManagerById = async (id: string): Promise<ProfileManagerType | null> => {
    return await ProfileManager.findOne({ where: { id }, plain: true });
};
