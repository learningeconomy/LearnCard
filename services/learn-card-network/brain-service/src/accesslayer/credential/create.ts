import { BitstringStatusListEntryValidator, UnsignedVC, VC, JWE } from '@learncard/types';
import type { Transaction } from 'neo4j-driver';
import { v4 as uuid } from 'uuid';
import { getBitstringStatusListEntries, isEncrypted } from '@learncard/helpers';
import { isIssuedCredential } from '@helpers/issuedCredentialStatus.helpers';
import type { IssuedCredential } from 'types/credential';

import { Credential, CredentialInstance } from '@models';
import { neogma } from '@instance';
import { reserveCredentialStatusEntries } from '@helpers/status-list.helpers';

export const storeCredential = async (
    input: UnsignedVC | VC | JWE | IssuedCredential,
    transaction?: Transaction,
    statusOwnerProfileId?: string
): Promise<CredentialInstance> => {
    const id = uuid();

    const issued = isIssuedCredential(input);
    const credential = issued ? input.credential : input;
    // Fail if an internal issuance result lost its metadata. Pre-signed wire
    // payloads remain supported, with an explicit revocation warning.
    const statusEntries = issued
        ? BitstringStatusListEntryValidator.array().parse(input.statusEntries)
        : undefined;
    const encrypted = isEncrypted(credential);
    if (
        !statusEntries?.length &&
        (encrypted || !getBitstringStatusListEntries(credential).length)
    ) {
        console.warn(
            `[storeCredential] ${encrypted ? 'Encrypted' : 'Plaintext'} credential has no status metadata; network revocation and suspension cannot update its signed status list.`,
            { credentialId: id }
        );
    }
    const create = (session?: Transaction) =>
        Credential.createOne(
            {
                id,
                credential: JSON.stringify(credential),
                ...(statusEntries?.length ? { statusEntries: JSON.stringify(statusEntries) } : {}),
            },
            session ? { session } : undefined
        );
    const entries = statusEntries ?? getBitstringStatusListEntries(credential);
    if (!statusOwnerProfileId || entries.length === 0) return create(transaction);
    return neogma.getTransaction(transaction ?? null, async tx => {
        await reserveCredentialStatusEntries(entries, statusOwnerProfileId, id, tx);
        return create(tx);
    });
};
