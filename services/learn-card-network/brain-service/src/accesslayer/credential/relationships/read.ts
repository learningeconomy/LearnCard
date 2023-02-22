import { CredentialInstance, Profile, ProfileInstance } from '@models';

export const getCredentialSentToProfile = async (
    id: string,
    from: ProfileInstance,
    to: ProfileInstance
): Promise<CredentialInstance | undefined> => {
    return (
        await from.findRelationships({
            alias: 'credentialSent',
            where: {
                relationship: { to: to.profileId },
                target: { id },
            },
        })
    )[0]?.target;
};

export const getCredentialOwner = async (
    credential: CredentialInstance
): Promise<ProfileInstance | undefined> => {
    const id = credential.id;

    return (
        await Profile.findRelationships({
            alias: 'credentialSent',
            where: {
                target: { id },
            },
        })
    )[0]?.source;
};
