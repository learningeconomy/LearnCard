import crypto from 'crypto';

import { v4 as uuid } from 'uuid';

import { LCNProfile } from '@learncard/types';

import { getLearnCard } from '@helpers/learnCard.helpers';
import { createProfile } from '@accesslayer/profile/create';
import { ProfileManager, ProfileManagerInstance } from '@models';
import { ProfileType } from 'types/profile';

export const createProfileManager = async (
    input: Omit<LCNProfile, 'profileId' | 'did'>
): Promise<{ manager: ProfileManagerInstance; profile: ProfileType }> => {
    const id = uuid();

    const manager = await ProfileManager.createOne({ id });

    const randomSeed = crypto.randomBytes(32).toString('hex');

    const spLearnCard = await getLearnCard(randomSeed);

    const profile = await createProfile({
        ...input,
        profileId: `managed:${id}`,
        did: spLearnCard.id.did(),
    });

    await manager.relateTo({
        alias: 'manages',
        where: { profileId: profile.profileId },
    });

    return { manager, profile };
};
