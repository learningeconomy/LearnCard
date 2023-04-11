import { PresentationInstance, Profile, ProfileRelationships, ProfileInstance } from '@models';

export const getPresentationSentToProfile = async (
    id: string,
    to: ProfileInstance
): Promise<
    | {
          source: ProfileInstance;
          relationship: ProfileRelationships['presentationSent']['RelationshipProperties'];
          target: PresentationInstance;
      }
    | undefined
> => {
    return (
        await Profile.findRelationships({
            alias: 'presentationSent',
            where: { relationship: { to: to.profileId }, target: { id } },
        })
    )[0];
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
