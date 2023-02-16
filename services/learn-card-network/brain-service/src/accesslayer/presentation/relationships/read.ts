import { PresentationInstance, ProfileInstance } from '@models';

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
