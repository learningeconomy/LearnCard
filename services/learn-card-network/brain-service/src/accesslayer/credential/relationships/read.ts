import { CredentialInstance, Profile, ProfileRelationships, ProfileInstance } from '@models';

export const getCredentialSentToProfile = async (
    id: string,
    to: ProfileInstance
): Promise<
    | {
        source: ProfileInstance;
        relationship: ProfileRelationships['credentialSent']['RelationshipProperties'];
        target: CredentialInstance;
    }
    | undefined
> => {
    return (
        await Profile.findRelationships({
            alias: 'credentialSent',
            where: { relationship: { to: to.profileId }, target: { id } },
        })
    )[0];
};

export const getCredentialOwner = async (
    credential: CredentialInstance
): Promise<ProfileInstance | undefined> => {
    const id = credential.id;

    return (
        await Profile.findRelationships({ alias: 'credentialSent', where: { target: { id } } })
    )[0]?.source;
};
