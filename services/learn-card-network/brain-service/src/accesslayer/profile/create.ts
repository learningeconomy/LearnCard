import { LCNProfile } from '@learncard/types';

import { Profile, ProfileInstance } from '@models';

export const createProfile = async (input: LCNProfile): Promise<ProfileInstance> => {
    return Profile.createOne(input);
};
