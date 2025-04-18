import { deleteDidDocForProfile, deleteDidDocForProfileManager } from '@cache/did-docs';
import { BoostPermissions } from '@learncard/types';
import { BoostInstance, ProfileManager } from '@models';
import { ProfileType } from 'types/profile';

export const updateBoostPermissions = async (
    profile: ProfileType,
    boost: BoostInstance,
    permissions: Partial<BoostPermissions>
): Promise<boolean> => {
    const result = await boost.updateRelationship(permissions, {
        alias: 'hasRole',
        where: { target: { profileId: profile.profileId } },
    });

    return result.summary.counters.updates().propertiesSet > 0;
};

export const clearDidWebCacheForChildProfileManagers = async (boostId: string): Promise<void> => {
    const childProfileManagers = await ProfileManager.findRelationships({
        alias: 'childOf',
        where: { target: { id: boostId } },
    });

    if (childProfileManagers.length > 0) {
        await Promise.all(
            childProfileManagers.map(async ({ source: manager }) => {
                await deleteDidDocForProfileManager(manager.id);

                const profiles = await ProfileManager.findRelationships({
                    alias: 'manages',
                    where: { source: { id: manager.id } },
                });

                if (profiles.length > 0) {
                    await Promise.all(
                        profiles.map(async ({ target: profile }) => {
                            await deleteDidDocForProfile(profile.profileId);
                        })
                    );
                }
            })
        );
    }
};
