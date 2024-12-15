import { v4 as uuid } from 'uuid';

import { ProfileManager, ProfileManagerInstance } from '@models';
import { ProfileManagerType } from 'types/profile-manager';

export const createProfileManager = async (
    input: Omit<ProfileManagerType, 'id'>
): Promise<ProfileManagerInstance> => {
    const id = uuid();

    return ProfileManager.createOne({ ...input, id });
};
