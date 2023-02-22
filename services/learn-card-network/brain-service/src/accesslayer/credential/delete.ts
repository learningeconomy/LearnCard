import { CredentialInstance } from '@models';

export const deleteCredential = async (credential: CredentialInstance): Promise<void> => {
    await credential.delete({ detach: true });
};
