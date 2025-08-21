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

/** Remove a single explicit auto-connect recipient relationship for a boost */
export const removeAutoConnectRecipientRelationship = async (
    boost: BoostInstance,
    recipient: ProfileType
): Promise<void> => {
    await Boost.deleteRelationships({
        alias: 'autoConnectRecipient',
        where: { source: { id: boost.id }, target: { profileId: recipient.profileId } },
    });
};

/** Remove all explicit auto-connect recipient relationships for a boost */
export const removeAutoConnectRecipientRelationshipsForBoost = async (
    boost: BoostInstance
): Promise<void> => {
    await Boost.deleteRelationships({
        alias: 'autoConnectRecipient',
        where: { source: { id: boost.id } },
    });
};
