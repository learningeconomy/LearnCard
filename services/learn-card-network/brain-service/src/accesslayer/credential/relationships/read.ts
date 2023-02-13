import { CredentialInstance, ProfileInstance } from '@models';

export const getCredentialSentToProfile = async (
    id: string,
    from: ProfileInstance,
    to: ProfileInstance
): Promise<CredentialInstance | undefined> => {
    return (
        await from.findRelationships({
            alias: 'credentialSent',
            where: {
                relationship: { to: to.handle },
                target: { id },
            },
        })
    )[0]?.target;
};
