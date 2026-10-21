import type { JWE } from '@learncard/types';

import { getLearnCard } from '@helpers/learnCard.helpers';

export const INBOX_JWE_PREFIX = 'lc-inbox-jwe:v1:';

export const isEncryptedInboxCredential = (credential: string): boolean =>
    credential.startsWith(INBOX_JWE_PREFIX);

/** Encrypts an inbox payload to the brain-service key before it crosses the persistence boundary. */
export const encryptInboxCredential = async (credential: string): Promise<string> => {
    if (isEncryptedInboxCredential(credential)) return credential;

    const learnCard = await getLearnCard();
    const jwe = await learnCard.invoke.createDagJwe({ credential }, [learnCard.id.did()]);

    return `${INBOX_JWE_PREFIX}${JSON.stringify(jwe)}`;
};

/** Decrypts only for finalization. Plaintext support is temporary for rolling migration. */
export const decryptInboxCredential = async (credential?: string): Promise<string> => {
    if (!credential) throw new Error('Inbox credential payload has already been removed');
    if (!isEncryptedInboxCredential(credential)) return credential;

    const learnCard = await getLearnCard();
    const jwe = JSON.parse(credential.slice(INBOX_JWE_PREFIX.length)) as JWE;
    const decrypted = await learnCard.invoke.decryptDagJwe<unknown>(jwe);

    // Some crypto backends return an empty value instead of rejecting failed decryption.
    if (
        !decrypted ||
        typeof decrypted !== 'object' ||
        !('credential' in decrypted) ||
        typeof decrypted.credential !== 'string'
    ) {
        throw new Error('Unable to decrypt inbox credential payload');
    }

    return decrypted.credential;
};
