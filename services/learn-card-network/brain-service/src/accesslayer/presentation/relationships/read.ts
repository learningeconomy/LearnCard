import { inflateObject } from '@helpers/objects.helpers';
import { Presentation, Profile, type PresentationInstance, type ProfileRelationships } from '@models';
import type { ProfileType } from 'types/profile';

export const getPresentationSentToProfile = async (
    id: string,
    to: ProfileType
): Promise<
    | {
        source: ProfileType;
        relationship: ProfileRelationships['presentationSent']['RelationshipProperties'];
        target: PresentationInstance;
    }
    | undefined
> => {
    const data = (
        await Profile.findRelationships({
            alias: 'presentationSent',
            where: { relationship: { to: to.profileId }, target: { id } },
        })
    )[0];

    if (!data) return undefined;

    return { ...data, source: inflateObject(data.source.dataValues as any) };
};

export const getPresentationOwner = async (
    presentation: PresentationInstance
): Promise<ProfileType | undefined> => {
    const id = presentation.id;

    const owner = (
        await Profile.findRelationships({
            alias: 'presentationSent',
            where: { target: { id } },
        })
    )[0]?.source;

    if (!owner) return undefined;

    return inflateObject<ProfileType>(owner.dataValues as any);
};

export const getPresentationReceivedByProfile = async (
    presentationId: string,
    profile: ProfileType
): Promise<boolean> => {
    const relationships = await Presentation.findRelationships({
        alias: 'presentationReceived',
        where: {
            source: { id: presentationId },
            target: { profileId: profile.profileId },
        },
    });

    return relationships.length > 0;
};
