import { ProfileInstance, BoostInstance, Profile, Boost } from '@models';

export const removeProfileAsBoostAdmin = async (
    profile: ProfileInstance,
    boost: BoostInstance
): Promise<void> => {
    await Profile.deleteRelationships({
        alias: 'adminOf',
        where: { source: { profileId: profile.profileId }, target: { id: boost.id } },
    });
};

export const removeBoostAsParent = async (
    parentBoost: BoostInstance,
    childBoost: BoostInstance
): Promise<boolean> => {
    return Boolean(
        await Boost.deleteRelationships({
            alias: 'parentOf',
            where: { source: { id: parentBoost.id }, target: { id: childBoost.id } },
        })
    );
};
