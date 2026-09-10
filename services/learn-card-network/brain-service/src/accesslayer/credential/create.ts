import { UnsignedVC, VC, JWE } from '@learncard/types';
import { v4 as uuid } from 'uuid';
import { isEncrypted } from '@learncard/helpers';
import { getIssuedCredentialStatus } from '@helpers/issuedCredentialStatus.helpers';

import { Credential, CredentialInstance } from '@models';

export const storeCredential = async (
    credential: UnsignedVC | VC | JWE
): Promise<CredentialInstance> => {
    const id = uuid();

    const statusEntries = isEncrypted(credential)
        ? getIssuedCredentialStatus(credential as JWE)
        : undefined;
    return Credential.createOne({
        id,
        credential: JSON.stringify(credential),
        ...(statusEntries?.length ? { statusEntries: JSON.stringify(statusEntries) } : {}),
    });
};
