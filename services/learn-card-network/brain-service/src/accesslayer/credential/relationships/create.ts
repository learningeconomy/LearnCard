import { CredentialInstance, ProfileInstance } from '@models';

export const createSentCredentialRelationship = async (
    from: ProfileInstance,
    to: ProfileInstance,
    credential: CredentialInstance
): Promise<void> => {
    await from.relateTo({
        alias: 'credentialSent',
        where: { id: credential.id },
        properties: { to: to.profileId, date: new Date().toISOString() },
    });
};

export const createReceivedCredentialRelationship = async (
    to: ProfileInstance,
    from: ProfileInstance,
    credential: CredentialInstance
): Promise<void> => {
    await credential.relateTo({
        alias: 'credentialReceived',
        where: { profileId: to.profileId },
        properties: { from: from.profileId, date: new Date().toISOString() },
    });
};
