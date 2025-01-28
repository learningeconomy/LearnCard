import { v4 as uuid } from 'uuid';

import { ProfileManager, ProfileManagerInstance } from '@models';
import { ProfileManagerType } from 'types/profile-manager';

export const createProfileManager = async (
    input: Omit<ProfileManagerType, 'id' | 'created'>
): Promise<ProfileManagerInstance> => {
    const id = uuid();

    return ProfileManager.createOne({ ...input, id, created: new Date().toISOString() });
};
