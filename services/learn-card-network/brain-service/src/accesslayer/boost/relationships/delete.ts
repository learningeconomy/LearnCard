import { BoostInstance, Boost } from '@models';
import { ProfileType } from 'types/profile';

export const removeProfileAsBoostAdmin = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<void> => {
    await Boost.deleteRelationships({
        alias: 'hasRole',
        where: { target: { profileId: profile.profileId }, source: { id: boost.id } },
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
