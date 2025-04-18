import { BoostInstance, Boost } from '@models';
import { ProfileType } from 'types/profile';
import { clearDidWebCacheForChildProfileManagers } from './update';

export const removeProfileAsBoostAdmin = async (
    profile: ProfileType,
    boost: BoostInstance
): Promise<void> => {
    await Boost.deleteRelationships({
        alias: 'hasRole',
        where: { target: { profileId: profile.profileId }, source: { id: boost.id } },
    });

    await clearDidWebCacheForChildProfileManagers(boost.id);
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
