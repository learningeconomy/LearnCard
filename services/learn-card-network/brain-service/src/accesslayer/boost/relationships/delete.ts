import { ProfileInstance, BoostInstance, Profile } from '@models';

export const removeProfileAsBoostAdmin = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<void> => {
    await Profile.deleteRelationships({
        alias: 'adminOf',
        where: { source: { profileId: profile.profileId }, target: { id: boost.id } },
    });
};
