import { CredentialInstance, ProfileInstance, BoostInstance } from '@models';

export const createBoostInstanceOfRelationship = async (
    credential: CredentialInstance,
    boost: BoostInstance
): Promise<void> => {
    await credential.relateTo({ alias: 'instanceOf', where: { id: boost.id } });
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
