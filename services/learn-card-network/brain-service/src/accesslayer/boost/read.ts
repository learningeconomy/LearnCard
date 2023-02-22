import { Boost, BoostInstance, ProfileInstance } from '@models';

export const getBoostById = async (id: string): Promise<BoostInstance | null> => {
    return Boost.findOne({ where: { id } });
};

export const getBoostsForProfile = async (profile: ProfileInstance): Promise<BoostInstance[]> => {
    const results = await Boost.findRelationships({
        alias: 'createdBy',
        where: { target: { profileId: profile.profileId } },
    });

    return results.map(result => result.source);
};
