import { PresentationInstance, Profile, ProfileInstance } from '@models';

export const getPresentationSentToProfile = async (
    id: string,
    from: ProfileInstance,
    to: ProfileInstance
): Promise<PresentationInstance | undefined> => {
    return (
        await from.findRelationships({
            alias: 'presentationSent',
            where: {
                relationship: { to: to.profileId },
                target: { id },
            },
        })
    )[0]?.target;
};

export const getPresentationOwner = async (
    presentation: PresentationInstance
): Promise<ProfileInstance | undefined> => {
    const id = presentation.id;

    return (
        await Profile.findRelationships({
            alias: 'presentationSent',
            where: {
                target: { id },
            },
        })
    )[0]?.source;
};
