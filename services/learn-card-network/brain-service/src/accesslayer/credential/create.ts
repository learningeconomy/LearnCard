import { UnsignedVC, VC } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Credential, CredentialInstance } from '@models';

export const storeCredential = async (credential: UnsignedVC | VC): Promise<CredentialInstance> => {
    const id = uuid();

    return Credential.createOne({ id, credential: JSON.stringify(credential) });
};
