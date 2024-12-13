import { PresentationInstance, Profile } from '@models';
import { ProfileType } from 'types/profile';

export const createSentPresentationRelationship = async (
    from: ProfileType,
    to: ProfileType,
    presentation: PresentationInstance
): Promise<void> => {
    await Profile.relateTo({
        alias: 'presentationSent',
        where: { source: { profileId: from.profileId }, target: { id: presentation.id } },
        properties: { to: to.profileId, date: new Date().toISOString() },
    });
};

export const createReceivedPresentationRelationship = async (
    to: ProfileType,
    from: ProfileType,
    presentation: PresentationInstance
): Promise<void> => {
    await presentation.relateTo({
        alias: 'presentationReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};
