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
    if (isEncrypted(credential) && !statusEntries) {
        console.warn(
            '[storeCredential] Encrypted credential has no status metadata; network revocation and suspension cannot update its signed status list.',
            { credentialId: id }
        );
    }
    return Credential.createOne({
        id,
        credential: JSON.stringify(credential),
        ...(statusEntries?.length ? { statusEntries: JSON.stringify(statusEntries) } : {}),
    });
};
