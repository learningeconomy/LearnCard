import type { UnsignedVC, VC, JWE } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import { Credential, type CredentialInstance } from '@models';

export const storeCredential = async (
    credential: UnsignedVC | VC | JWE
): Promise<CredentialInstance> => {
    const id = uuid();

    return Credential.createOne({ id, credential: JSON.stringify(credential) });
};
