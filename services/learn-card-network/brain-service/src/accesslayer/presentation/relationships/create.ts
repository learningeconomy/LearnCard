import { PresentationInstance, ProfileInstance } from '@models';

export const createSentPresentationRelationship = async (
    from: ProfileInstance,
    to: ProfileInstance,
    presentation: PresentationInstance
): Promise<void> => {
    await from.relateTo({
        alias: 'presentationSent',
        where: { id: presentation.id },
        properties: { to: to.profileId, date: new Date().toISOString() },
    });
};

export const createReceivedPresentationRelationship = async (
    to: ProfileInstance,
    from: ProfileInstance,
    presentation: PresentationInstance
): Promise<void> => {
    await presentation.relateTo({
        alias: 'presentationReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};
