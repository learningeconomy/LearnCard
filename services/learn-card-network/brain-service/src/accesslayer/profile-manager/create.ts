import { v4 as uuid } from 'uuid';

import { ProfileManager, type ProfileManagerInstance } from '@models';
import type { ProfileManagerType } from 'types/profile-manager';

export const createProfileManager = async (
    input: Omit<ProfileManagerType, 'id' | 'created'>
): Promise<ProfileManagerInstance> => {
    const id = uuid();

    return ProfileManager.createOne({ ...input, id, created: new Date().toISOString() });
};
