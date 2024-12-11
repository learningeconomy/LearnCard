import { inflateObject } from '@helpers/objects.helpers';
import { CredentialInstance, Profile, ProfileRelationships } from '@models';
import { ProfileType } from 'types/profile';

export const getCredentialSentToProfile = async (
    id: string,
    to: ProfileType
): Promise<
    | {
        source: ProfileType;
        relationship: ProfileRelationships['credentialSent']['RelationshipProperties'];
        target: CredentialInstance;
    }
    | undefined
> => {
    const data = (
        await Profile.findRelationships({
            alias: 'credentialSent',
            where: { relationship: { to: to.profileId }, target: { id } },
        })
    )[0];

    if (!data) return undefined;

    return { ...data, source: inflateObject(data.source.dataValues as any) };
};

export const getCredentialOwner = async (
    credential: CredentialInstance
): Promise<ProfileType | undefined> => {
    const id = credential.id;

    const owner = (
        await Profile.findRelationships({ alias: 'credentialSent', where: { target: { id } } })
    )[0]?.source;

    if (!owner) return undefined;

    return inflateObject<ProfileType>(owner.dataValues as any);
};
